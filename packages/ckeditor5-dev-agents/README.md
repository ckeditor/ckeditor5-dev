CKEditor 5 agents
=================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-agents.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

A framework for running recurring AI agent tasks against repositories. The results of every run arrive as a pull request against the repository, where a human reviews them.

## How a run works

For every target and every task enabled in it:

1. The task lists its **units** and returns a **content hash** for each of them. Units whose hash matches the baseline from the previous run are skipped. Of the changed units, the run takes at most `maxUnits` (100 by default). The others are left for the next runs.
2. **Judge.** The task returns the findings of every taken unit. Up to `concurrency` units are judged at the same time. An agent used here has read-only tools.
3. **Fix** (tasks with `writes` only). Then, one unit at a time, the task changes files to resolve its findings. A fix may change several files matching `writes`. An agent used here can edit files.
4. **Check.** Only files matching `writes` may change. `verify()`, if defined, runs first and must pass. The harness then hashes all units and judges every affected unit again. This must not introduce findings or undo an earlier accepted fix, and at least one finding of the fixed unit must be gone. Otherwise, the harness restores the files and Git staging state from before the fix. An affected unit skipped by the baseline or deferred by `maxUnits` is judged before and after the fix; these extra checks do not advance its baseline.
5. Findings that are already open, or rejected by a human decision that still holds, are dropped. The rest are recorded, and the state is written to `<target root>/.ai-tasks/<task>/`.

Kept fixes and the state stay in the working tree. That is where a **local run** ends: nothing is committed or pushed, and `git diff` shows the result. A **published run** (`--publish`) goes on, on its own report branch per task: it commits and pushes once, opens or updates the report pull request, comments with a summary, and checks out the base branch again.

A human is involved only in the pull request, after everything was judged, fixed and checked. Findings never fail a run. A run fails when a task or a unit could not be processed, or publishing failed. A publishing failure preserves the task summary and does not stop the remaining tasks.

While a run works, it logs its progress: the targets and tasks, the units being judged and fixed, and the tool calls of the agent. At the end, the command prints one block per task:

```
Task name · repository (master) · local
  Units        304 in scope · 304 changed · 100 judged · 204 left for the next runs
  Findings     26 new · 0 already open · 0 rejected
  Fixes        13 fixed · 0 discarded
  Files        12 changed
  Open         13
  Cost         $0.84 · 412000 tokens · 6 min 12 s
  Problems     none
```

## Running

```bash
# Local run in the current checkout: every target of the checkout, the tasks each one enables.
ckeditor5-dev-agents --config ai-tasks

# Local run of one task (even if the target disables it).
ckeditor5-dev-agents --config ai-tasks --task my-task

# Published run: commit, push, and open or update the report pull requests.
AI_TASKS_GITHUB_TOKEN=… ckeditor5-dev-agents --config ai-tasks --publish
```

| Argument | Description |
| --- | --- |
| `--config <path>` | The directory with `tasks/` and `targets/`. Default: `ai-tasks`. |
| `--cwd <path>` | A directory inside the checkout to run in. Default: the current directory. |
| `--target <name>` | The targets to run, repeatable or comma-separated. Default: the targets whose `slug` matches the `origin` of the checkout. |
| `--task <id>` | The tasks to run, repeatable or comma-separated. Default: the tasks each target enables. |
| `--publish` | Commit and push the state and the fixes, and open or update the report pull requests. |

| Environment variable | Description |
| --- | --- |
| `AI_TASKS_GITHUB_TOKEN` | Published runs only. A token that can open pull requests and comment on them. Pushing uses the credentials of the checkout. |
| `AI_TASKS_GIT_NAME`, `AI_TASKS_GIT_EMAIL` | The author of the commits of published runs. Default: `CKEditor AI Tasks <ai-tasks@users.noreply.github.com>`. |
| `AI_TASKS_BUILD_URL` | Optional. A link to the CI build, added to the run comments. |

The report pull requests of a published run target the checked-out branch. Publishing fails with a clear message, and does not try to fix it, when:

* `HEAD` is detached: check out the base branch.
* The working tree has uncommitted changes: publishing switches branches.
* The checkout is shallow: merging the base branch into an open report branch needs the history. Configure the checkout in CI to fetch the whole history.
* A `.gitignore` file ignores the state of a task in `<target root>/.ai-tasks/`: publishing commits it.

To undo a local run, reset the working tree from the repository root: `git checkout -- .`, and `git clean -fd -- <root>/.ai-tasks` for the `root` of every target.

The package runs only from the command line. What it exports is for task and target modules: `defineTask()`, `defineTarget()`, `findingSchema()` and their types.

## Configuration

```
ai-tasks/
├── tasks/
│   └── <id>/
│       ├── index.js      The task.
│       ├── INSTRUCTIONS.md
│       └── skills/       Optional skills of the agent (`<name>/SKILL.md`), read only when the agent needs them.
└── targets/
    └── <name>.js         One file per repository.
```

Task and target modules may be `.js`, `.mjs`, `.ts` or `.mts` files that export their definition by default. Use `.mjs` or `.mts` when the `package.json` of the project does not set `"type": "module"`.

A task defines everything about the work: what it works on, its options, and its hooks. A target says where it runs. Every setting of a task can be overridden by a target.

### A task

Every hook receives one object. Destructure what the hook needs.

```js
import { defineTask, findingSchema } from '@ckeditor/ckeditor5-dev-agents';

const RULE_IDS = [ 'R1' ];

export default defineTask( {
	// Must match the directory name. Targets run the task under this name unless they name the instance otherwise,
	// and that name is part of every fingerprint, so do not rename it.
	id: 'my-task',
	title: 'My task',

	// The rules a finding may refer to.
	ruleIds: RULE_IDS,

	// The files the task works on. Without `scope()`, every matching file is a unit, with its path as the key.
	include: [ 'docs/**/*.md' ],
	exclude: [ 'docs/api/**' ],

	// Optional. How many changed units one run judges at most. Default: 100.
	maxUnits: 100,

	// Optional. The hooks receive them as `options`. A target can override each of them.
	defaultOptions: {
		threshold: 10
	},

	// Optional. The agent that `agent.run()` runs.
	agent: {
		model: { provider: 'anthropic', id: 'claude-sonnet-5' },
		apiKey: process.env.MY_TASK_API_KEY,
		instructionsPath: 'INSTRUCTIONS.md',
		skills: [ 'skills' ]
	},

	// Optional. The files `fix()` may change. Setting them enables fixing.
	writes: [ 'docs/**/*.md' ],

	async contentHash( { repo, hash, normalise, unit } ) {
		return hash( normalise( await repo.read( unit.path ) ) );
	},

	async payload( { unit } ) {
		return { path: unit.path };
	},

	async judge( { agent, options, payload, priorDecisions } ) {
		const { output } = await agent.run( {
			prompt: `Check \`${ payload.path }\` with the threshold of ${ options.threshold }. ` +
				`Human decisions about it: ${ JSON.stringify( priorDecisions ) }`,
			outputSchema: findingSchema( { ruleIds: RULE_IDS } )
		} );

		return output.findings;
	},

	async fix( { agent, unit, findings } ) {
		await agent.run( { prompt: `Fix these findings in \`${ unit.path }\`: ${ JSON.stringify( findings ) }` } );
	}
} );
```

`defineTask()` returns the task unchanged. It only helps with types, in TypeScript and in JavaScript files alike: every hook gets its input typed without annotations. `options` is inferred from `defaultOptions`, `shared` from what `prepare()` returns, `payload` from what `payload()` returns, and `unit` from what `scope()` returns. A task without `scope()` gets `FileUnit` units, with a `path`. A plain object typed as `Task<Shared, Unit, Payload, Options>` works too.

| Member | Description |
| --- | --- |
| `id`, `title`, `ruleIds` | Required. |
| `include`, `exclude` | The globs of the files the task works on, relative to the target root. Required without `scope()`. |
| `maxUnits` | Optional. How many changed units one run initially selects, as an integer of 1 or more. Fix validation may judge additional affected units. Default: 100. |
| `defaultOptions` | Optional. The options the hooks receive as `options`. |
| `prepare( tools )` | Optional. Runs once. What it returns is passed to every other hook as `shared`. |
| `scope( { shared, include, exclude, …tools } )` | Optional. Returns the units, when they are not files: `[ { key, path?, … } ]`. `key` must be unique and stable. `path` makes reports link to the file. |
| `contentHash( { shared, unit, …tools } )` | Returns a string that changes exactly when the result of `judge()` could change. |
| `payload( { shared, unit, …tools } )` | Returns what `judge()` sees. |
| `judge( { shared, unit, payload, priorDecisions, …tools } )` | Returns the findings: `[ { ruleId, detail, discriminator?, … } ]`. `priorDecisions` are the human decisions about the unit, each marked as `expired` when the content has changed since. |
| `fix( { shared, unit, findings, …writable tools } )` | Optional, requires `writes`. Changes the files so the `findings` (those no decision rejects) no longer apply. |
| `verify( { shared, unit, …writable tools } )` | Optional, requires `fix()`. Throws when the fixed unit is broken, for example when the tests fail. |
| `writes` | Optional. Globs of the files `fix()` may change, relative to the target root and without a leading `./`. A fix may change several of them, for example the unit and the files that refer to it. |
| `concurrency` | Optional. How many units are judged at the same time, as an integer of 1 or more. Default: 1. Fixes always run one unit at a time, after every unit is judged. |
| `agent` | Optional. See below. |

### A target

```js
import { defineTarget } from '@ckeditor/ckeditor5-dev-agents';

export default defineTarget( {
	// The repository on GitHub. A run in a checkout of it uses this target, and the report pull requests go there.
	slug: 'ckeditor/ckeditor5',

	// The target root inside the repository. Tasks see paths relative to it, and the state lives in `<root>/.ai-tasks/`.
	root: '.',

	tasks: {
		// Runs the `my-task` task with its own settings.
		'my-task': {},

		// Runs the same task again, on other files and with another option.
		'my-task-api': {
			task: 'my-task',
			include: [ 'docs/api/**/*.md' ],
			exclude: [],
			options: { threshold: 5 }
		}
	}
} );
```

The key of an entry names the instance. It identifies everything a run keeps apart: the state in `.ai-tasks/<name>/`, the findings and their IDs, the report branch, and `--task`. An entry accepts:

| Setting | Description |
| --- | --- |
| `task` | The task to run. Default: the name of the entry. |
| `enabled` | Set to `false` to run the instance only when it is requested with `--task`. Default: `true`. |
| `include`, `exclude`, `maxUnits` | Replace the ones of the task. |
| `options` | Override single `defaultOptions` of the task. The others keep their defaults. |

Keep these rules in mind:

* **`key`, `contentHash()` and `payload()` are three different things.** `key` is identity. `contentHash()` defines what counts as a change. `payload()` is what the judge sees, and it is often larger than the unit.
* **`contentHash()` must cover everything `judge()` reads.** If a finding depends on something outside the unit, hash that too. Otherwise the finding goes stale silently.
* **Normalise text only when the task ignores those differences.** `normalise()` folds whitespace, entities and typography. Hash source code or other whitespace-sensitive content directly so meaningful changes are judged again.
* **The instructions of a task are not part of the hash.** Changing them re-judges nothing. Delete `baseline.json` to re-judge everything.
* **Keep `shared` valid across fixes.** `prepare()` runs once. Read changing file content through `repo` in later hooks; the harness may temporarily restore earlier content to compare an affected unit before and after a fix. It restores files and the Git index, but does not roll back objects returned by `prepare()`.
* **Throw when a unit cannot be judged.** It keeps its old baseline entry, so the next run tries again.

### The tools

Next to their own data, all hooks receive these tools. In TypeScript, the input types are `PrepareInput`, `ScopeInput`, `UnitInput` (for `contentHash()` and `payload()`), `JudgeInput`, `FixInput` and `VerifyInput`.

| Tool | Description |
| --- | --- |
| `repo.list( globs, { ignore } )` | The files matching the arrays of globs, relative to the target root, sorted. |
| `repo.read( path )` | The content of a file relative to the target root. |
| `repo.write( path, content )`, `repo.remove( path )` | In `fix()` and `verify()` only. |
| `exec( command, args, { timeout } )` | In `fix()` and `verify()` only. Runs a command in the target root and throws when it fails or takes longer than `timeout` milliseconds. |
| `agent.run( { prompt, outputSchema } )` | Runs the agent of the task. With `outputSchema`, the agent must return its result through a tool with that schema, and `output` holds it. |
| `normalise( text )`, `hash( text )` | Text normalisation and a short, stable hash. |
| `options` | The task options from the target config. |
| `phase` | `judge`, `fix` or `verify`. |
| `log( message )` | Writes to the run log. |

### The agent

`agent.run()` runs a [Pi](https://pi.dev) agent session. Every run is a new session configured only by the task, so a task behaves the same on every machine. Nothing is read from `~/.pi`, `AGENTS.md` files are not loaded, and nothing is persisted.

The framework is not tied to a provider. Every task chooses its own model and provides its own API key, so tasks in the same project can use different providers, models, and keys. The standard variables of the providers, such as `ANTHROPIC_API_KEY`, are never read.

| Option | Description |
| --- | --- |
| `model` | Required. `{ provider, id }` of any model from the Pi catalog, for example `{ provider: 'anthropic', id: 'claude-sonnet-5' }`. |
| `apiKey` | Required when the task calls `agent.run()`. The API key of the provider. The task decides where it comes from, for example `process.env.MY_TASK_API_KEY`. |
| `thinkingLevel` | Optional. `off`, `minimal`, `low`, `medium`, `high` or `xhigh`. |
| `timeout` | Optional. How long one `agent.run()` may take, in seconds. A run that takes longer is aborted and the unit is retried on the next run. Default: 1800 (30 minutes). |
| `instructions`, `instructionsPath` | The system prompt, as text or as a path relative to the task directory. |
| `skills` | Directories with skills, relative to the task directory. The agent reads a skill only when it needs it. Every `agent.run()` is a new session, so put rules needed for every unit in the instructions instead: they cost no extra step and are cached by the provider. |
| `judgeTools` | The tools while judging. Only read-only tools are allowed. Default: `read`, `grep`, `find`, `ls`. |
| `fixTools` | The tools while fixing. Default: the read-only tools, `edit` and `write`. Add `bash` if the fix must run commands. Unknown tool names are rejected when the task is loaded. |

The agent works in the target root. Instructions and the skill inventory are loaded once per task phase and reused across its sessions. Usage includes sessions that fail or time out.

## The state

Every task keeps its state in the target repository, in `<target root>/.ai-tasks/<task>/`:

| File | Description |
| --- | --- |
| `baseline.json` | Unit key → the hash of what was judged. A unit is judged again only when its hash changes. |
| `open.json` | The findings. **The source of truth** of the report. A run only adds to it. The `reject` and `dismiss` commands remove findings. |
| `report.md` | The human-readable report, generated from `open.json` on every run. Do not edit it. |
| `decisions/*.yml` | Rejected findings, one per file. |

A finding is identified by its fingerprint: `task|unit|rule|discriminator`, with literal pipes and backslashes escaped, where `task` is the name of the instance. A finding with the same fingerprint as an open one is never reported twice. Its 12-character `id`, shown in `report.md` and stored next to the fingerprint in `open.json`, is derived from it. A fixed finding stays in `open.json` with its `fix` until the report pull request is merged, and the next report branch starts without it. After a local run, it stays until you commit or reset the working tree.

Report branches are named `ai-tasks/<task>/<target>/<branch>`. While the report pull request is open, the next runs continue its branch and merge the base branch into it first.

## Reviewing a report pull request

Every finding in `report.md` has a short ID, for example `[3fdb55a802c1]`. Longer prefixes of the full finding hash are also accepted; an ambiguous prefix produces a list of full IDs to choose from. For every finding:

* **Keep the fix** if it is right. Edit it in the pull request if it needs a change.
* **Reject the finding** if it is wrong. Check out the report branch and run:

  ```bash
  ckeditor5-dev-agents reject 3fdb55a802c1 --reason "This is intended."
  ```

  It writes a decision file to `.ai-tasks/<task>/decisions/`, removes the finding from `open.json`, restores every file of its fix from the base branch, and regenerates `report.md`. Commit and push the result. The decision holds for as long as the unit hashes to its `fragment`, and expires by itself when the judged content changes. If the finding comes back then, the report shows the previous claim and the answer. Every decision about a unit is also passed to `judge()`.
* **Dismiss the finding**: `ckeditor5-dev-agents dismiss 3fdb55a802c1` does the same, without a decision. The finding may be reported again once the judged content changes. Reverting its fix changes the content, so the next run judges and fixes a dismissed finding with a fix again.

A fix may share files with other fixes, for example when the fixes of two units changed the same file. Restoring those files undoes the other fixes too, so the command stops, lists them, and asks to re-run with `--force`. With `--force`, every affected fix is undone completely: its findings stay open, and the next run judges and fixes them again.

The commands also work after a local run. There, they restore the files from `HEAD`. When the files of the fix have no uncommitted changes, for example because the fix was already undone by hand, they restore nothing and say so. Both accept `--config`, `--cwd`, `--target` and `--task`, and neither commits anything.

Reverting a fix by hand, without rejecting the finding, means the task finds the problem and fixes it again on a later run. Merge the pull request to record the state on the base branch.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
