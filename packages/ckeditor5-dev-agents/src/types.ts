/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export type JsonSchema = Record<string, unknown>;

/**
 * A unit of work of a task, for example one guide or one dependency.
 */
export type TaskUnit = {

	/**
	 * The identity of the unit. It must be unique within the task and stable between runs.
	 */
	key: string;

	/**
	 * A path relative to the target root. When set, reports link to the file.
	 */
	path?: string;

	[ key: string ]: unknown;
};

/**
 * A unit of a task that works on files. Its path is also its key.
 */
export type FileUnit = TaskUnit & {
	path: string;
};

/**
 * What `judge()` returns for every problem it finds.
 */
export type FindingInput = {

	/**
	 * One of the task `ruleIds`.
	 */
	ruleId: string;

	/**
	 * A short explanation of what is wrong, written for the person who reviews it.
	 */
	detail: string;

	/**
	 * Tells apart findings of the same rule in the same unit, for example a heading.
	 */
	discriminator?: string;

	[ key: string ]: unknown;
};

/**
 * A finding as the harness stores it in `open.json`.
 */
export type Finding = {
	fingerprint: string;

	/**
	 * The short ID shown in the report and used by the `reject` and `dismiss` commands.
	 */
	id: string;

	/**
	 * The name of the task instance that reported it.
	 */
	task: string;
	unit: string;
	ruleId: string;
	discriminator: string;
	detail: string;

	/**
	 * The content hash of the unit the finding was made about.
	 */
	fragment: string;
	path?: string;
	reportedAt?: string;
	previousDecision?: Pick<Decision, 'file' | 'fragment' | 'finding' | 'reason'>;
	fix?: AppliedFix;

	[ key: string ]: unknown;
};

/**
 * A fix the harness kept, because the check after it passed.
 */
export type AppliedFix = {

	/**
	 * The files the fix changed, relative to the target root.
	 */
	files: Array<string>;

	/**
	 * The content hash of the unit after the fix.
	 */
	fragment: string;
	fixedAt: string;
};

/**
 * A human decision that rejects a finding, read from `decisions/*.yml`.
 */
export type Decision = {
	file: string;
	unit: string;
	rule: string;
	discriminator: string;
	fragment: string;
	finding: string;
	reason: string;
};

/**
 * A decision as `judge()` receives it. `expired` tells whether the content has changed since the decision.
 */
export type PriorDecision = Omit<Decision, 'file'> & {
	expired: boolean;
};

export type TaskAgentConfig = {

	/**
	 * Any model from the Pi catalog, for example `{ provider: 'anthropic', id: 'claude-sonnet-5' }`.
	 */
	model: {
		provider: string;
		id: string;
	};

	/**
	 * The API key of the model provider. Required when the task calls `agent.run()`. The standard variables
	 * of the providers, such as `ANTHROPIC_API_KEY`, are never used instead.
	 */
	apiKey?: string;
	thinkingLevel?: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

	/**
	 * How long one `agent.run()` may take, in seconds. Default: 1800 (30 minutes).
	 */
	timeout?: number;

	/**
	 * The system prompt of the agent.
	 */
	instructions?: string;

	/**
	 * A path to a file with the instructions, relative to the task directory. Used when `instructions` is not set.
	 */
	instructionsPath?: string;

	/**
	 * Directories with skills (`<name>/SKILL.md`), relative to the task directory.
	 */
	skills?: Array<string>;

	/**
	 * The tools of the agent while judging. They must be read-only. Default: `read`, `grep`, `find` and `ls`.
	 */
	judgeTools?: Array<string>;

	/**
	 * The tools of the agent while fixing. Default: the read-only tools, `edit` and `write`.
	 */
	fixTools?: Array<string>;
};

export type AgentRunOptions = {
	prompt: string;

	/**
	 * When set, the agent must return its result through a tool with this schema.
	 */
	outputSchema?: JsonSchema;
};

export type Agent = {
	run<TOutput = unknown>( options: AgentRunOptions ): Promise<{

		/**
		 * The structured result, when `outputSchema` was set.
		 */
		output: TOutput;

		/**
		 * The last text the agent wrote.
		 */
		text: string;
	}>;
};

export type TaskPhase = 'judge' | 'fix' | 'verify';

export type TaskOptions = Record<string, any>;

/**
 * The tools every hook receives in its input. While judging, `repo` can only read.
 */
export type TaskContext<TOptions extends TaskOptions = TaskOptions> = {
	phase: TaskPhase;

	/**
	 * The `defaultOptions` of the task, overridden by the `options` of the target.
	 */
	options: TOptions;
	agent: Agent;
	log: ( message: string ) => void;
	normalise: ( text: string ) => string;
	hash: ( text: string ) => string;
	repo: {

		/**
		 * An absolute path to the target root. Every path a task uses is relative to it.
		 */
		root: string;
		list( patterns: ReadonlyArray<string>, options?: { ignore?: ReadonlyArray<string> } ): Promise<Array<string>>;
		read( path: string ): Promise<string>;
	};
};

/**
 * The tools `fix()` and `verify()` receive in their input. They can also change files and run commands.
 */
export type WritableTaskContext<TOptions extends TaskOptions = TaskOptions> = Omit<TaskContext<TOptions>, 'repo'> & {
	repo: TaskContext[ 'repo' ] & {
		write( path: string, content: string ): Promise<void>;
		remove( path: string ): Promise<void>;
	};

	/**
	 * Runs a command in the target root. It throws when the command exits with a non-zero code or takes longer
	 * than `timeout` milliseconds.
	 */
	exec( command: string, args?: Array<string>, options?: { timeout?: number } ): Promise<{ output: string }>;
};

type MaybePromise<T> = T | Promise<T>;

export type PrepareInput<TOptions extends TaskOptions = TaskOptions> = TaskContext<TOptions>;

export type ScopeInput<TShared = any, TOptions extends TaskOptions = TaskOptions> = TaskContext<TOptions> & {
	shared: TShared;

	/**
	 * The `include` globs of the task, or of the target, which overrides them.
	 */
	include: ReadonlyArray<string>;

	/**
	 * The `exclude` globs of the task, or of the target, which overrides them.
	 */
	exclude: ReadonlyArray<string>;
};

/**
 * The input of `contentHash()` and `payload()`.
 */
export type UnitInput<
	TShared = any,
	TUnit extends TaskUnit = TaskUnit,
	TOptions extends TaskOptions = TaskOptions
> = TaskContext<TOptions> & {
	shared: TShared;
	unit: TUnit;
};

export type JudgeInput<
	TShared = any,
	TUnit extends TaskUnit = TaskUnit,
	TPayload = any,
	TOptions extends TaskOptions = TaskOptions
> = UnitInput<TShared, TUnit, TOptions> & {
	payload: TPayload;

	/**
	 * The human decisions about the unit, each marked as expired when the content has changed since.
	 */
	priorDecisions: Array<PriorDecision>;
};

export type FixInput<
	TShared = any,
	TUnit extends TaskUnit = TaskUnit,
	TOptions extends TaskOptions = TaskOptions
> = WritableTaskContext<TOptions> & {
	shared: TShared;
	unit: TUnit;

	/**
	 * The findings about the unit that no decision rejects.
	 */
	findings: Array<Finding>;
};

export type VerifyInput<
	TShared = any,
	TUnit extends TaskUnit = TaskUnit,
	TOptions extends TaskOptions = TaskOptions
> = WritableTaskContext<TOptions> & {
	shared: TShared;
	unit: TUnit;
};

/**
 * A task. A task is a module in `<config>/tasks/<id>/index.{js,mjs,ts,mts}` that exports it by default.
 */
export type Task<
	TShared = any,
	TUnit extends TaskUnit = TaskUnit,
	TPayload = any,
	TOptions extends TaskOptions = TaskOptions
> = {

	/**
	 * Must match the directory name. It is part of every fingerprint, so do not rename it.
	 */
	id: string;
	title: string;

	/**
	 * The rules a finding may refer to.
	 */
	ruleIds: ReadonlyArray<string>;

	/**
	 * The options the hooks receive as `options`. A target can override each of them.
	 */
	defaultOptions?: TOptions;

	/**
	 * Globs, relative to the target root, of the files the task works on. Without `scope()`, every matching file is
	 * a unit, with the path as its key. A target can override them.
	 */
	include?: ReadonlyArray<string>;

	/**
	 * Globs of the files to leave out of `include`. A target can override them.
	 */
	exclude?: ReadonlyArray<string>;

	/**
	 * How many changed units one run judges at most. Default: 100. A target can override it.
	 */
	maxUnits?: number;

	/**
	 * How many units are judged at the same time. Default: 1. Fixes always run one unit at a time.
	 */
	concurrency?: number;

	/**
	 * Globs, relative to the target root, of the files `fix()` may change. Setting them enables fixing.
	 */
	writes?: ReadonlyArray<string>;
	agent?: TaskAgentConfig;

	/**
	 * Runs once. What it returns is passed to every other hook as `shared`.
	 */
	prepare?( input: PrepareInput<TOptions> ): MaybePromise<TShared>;

	/**
	 * Returns the units. Optional when the task sets `include`: then every matching file is a unit.
	 */
	scope?( input: ScopeInput<TShared, TOptions> ): MaybePromise<Array<TUnit>>;

	/**
	 * Returns a string that changes exactly when the result of `judge()` could change. Use `hash()`.
	 */
	contentHash( input: UnitInput<TShared, TUnit, TOptions> ): MaybePromise<string>;

	/**
	 * Returns what `judge()` sees.
	 */
	payload( input: UnitInput<TShared, TUnit, TOptions> ): MaybePromise<TPayload>;

	judge( input: JudgeInput<TShared, TUnit, TPayload, TOptions> ): MaybePromise<Array<FindingInput>>;

	/**
	 * Changes the files so the findings no longer apply. Required when `writes` is set.
	 */
	fix?( input: FixInput<TShared, TUnit, TOptions> ): MaybePromise<void>;

	/**
	 * Throws when the fixed unit is broken, for example when the tests fail.
	 */
	verify?( input: VerifyInput<TShared, TUnit, TOptions> ): MaybePromise<void>;
};

/**
 * How a target runs a task. The key in `tasks` names the instance: it identifies its state (`.ai-tasks/<name>/`),
 * its findings, its report branch, and `--task`. Every setting overrides the one of the task.
 */
export type TargetTaskConfig = {

	/**
	 * The task to run. Default: the name of the instance.
	 */
	task?: string;

	/**
	 * Set to `false` to run the task only when it is requested explicitly. Default: `true`.
	 */
	enabled?: boolean;
	include?: Array<string>;
	exclude?: Array<string>;
	maxUnits?: number;

	/**
	 * Override single `defaultOptions` of the task. The others keep their defaults.
	 */
	options?: TaskOptions;
};

/**
 * A target. A target is a module in `<config>/targets/<name>.{js,mjs,ts,mts}` that exports it by default.
 */
export type TargetConfig = {

	/**
	 * The repository on GitHub, for example `ckeditor/ckeditor5`. A run uses the targets whose `slug` matches
	 * the `origin` of the checkout it runs in.
	 */
	slug: string;

	/**
	 * The target root inside the repository. Default: the repository root.
	 */
	root?: string;
	tasks: Record<string, TargetTaskConfig>;
};

/**
 * A task as a target runs it: under the name of the instance, with the overrides of the target applied.
 */
export type InstanceTask = Task & {
	include: ReadonlyArray<string>;
	exclude: ReadonlyArray<string>;
	maxUnits: number;

	/**
	 * The `defaultOptions` of the task, overridden by the `options` of the target.
	 */
	options: TaskOptions;
};

export type TaskInstance = {
	task: InstanceTask;

	/**
	 * An absolute path to the directory of the task definition.
	 */
	directory: string;
	enabled: boolean;
};

export type Target = {
	name: string;
	slug: string;
	root: string;
	tasks: Map<string, TaskInstance>;
};

/**
 * Something that went wrong in a run without stopping it.
 */
export type Problem = {
	unit?: string;
	message: string;
};

/**
 * What happened in one run of one task against one target.
 */
export type TaskSummary = {
	task: string;
	title: string;
	units: number;
	changed: number;
	judged: number;

	/**
	 * Changed units above `maxUnits`, left for the next runs.
	 */
	deferred: number;
	newFindings: number;
	alreadyOpen: number;
	rejected: number;

	/**
	 * The findings resolved by kept fixes.
	 */
	fixed: number;

	/**
	 * The findings whose fix was discarded. They stay open.
	 */
	discarded: number;
	changedFiles: number;
	open: number;

	/**
	 * The units that could not be processed. They make the run fail.
	 */
	errors: number;

	/**
	 * The errors, the discarded fixes and the warnings.
	 */
	problems: Array<Problem>;

	/**
	 * In US dollars, as reported by the model provider.
	 */
	cost: number;
	tokens: number;
};
