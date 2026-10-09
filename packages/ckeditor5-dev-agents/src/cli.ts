/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs, type ParseArgsOptionsConfig } from 'node:util';
import upath from 'upath';
import { runTasks, type RunTasksOptions } from './runtasks.js';
import { renderConsoleSummary } from './report/renderconsolesummary.js';
import { renderResolvedFinding, resolveFinding, type ResolveFindingOptions } from './commands/resolvefinding.js';
import { getErrorMessage } from './utils/strings.js';

// The arguments every command accepts.
const COMMON_OPTIONS = {
	config: { type: 'string', default: 'ai-tasks' },
	cwd: { type: 'string', default: '.' },
	target: { type: 'string', multiple: true, default: [] },
	task: { type: 'string', multiple: true, default: [] }
} satisfies ParseArgsOptionsConfig;

/**
 * Parses the arguments of the `ckeditor5-dev-agents` command:
 *
 * * `--config <path>`: the directory with `tasks/` and `targets/`. Default: `ai-tasks`.
 * * `--cwd <path>`: a directory inside the checkout to run in. Default: the current directory.
 * * `--target <name>`: the targets to run (repeatable or comma-separated). Default: the targets of the checkout.
 * * `--task <id>`: the tasks to run (repeatable or comma-separated). Default: the tasks each target enables.
 * * `--publish`: commit and push the state and the fixes, and open or update the report pull requests.
 *
 * Paths are relative to the current directory.
 */
export function parseArguments(
	cliArguments: Array<string>,
	{ cwd = process.cwd(), env = process.env }: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): RunTasksOptions {
	const { values } = parseArgs( {
		args: cliArguments,
		options: {
			...COMMON_OPTIONS,
			publish: { type: 'boolean', default: false }
		}
	} );

	if ( values.publish && !env.AI_TASKS_GITHUB_TOKEN ) {
		throw new Error( 'A published run needs a GitHub token in the "AI_TASKS_GITHUB_TOKEN" environment variable.' );
	}

	return {
		...resolveCommonArguments( values, cwd ),
		token: values.publish ? env.AI_TASKS_GITHUB_TOKEN : undefined,
		author: {
			name: env.AI_TASKS_GIT_NAME || 'CKEditor AI Tasks',
			email: env.AI_TASKS_GIT_EMAIL || 'ai-tasks@users.noreply.github.com'
		},
		buildUrl: env.AI_TASKS_BUILD_URL
	};
}

/**
 * Parses the arguments of the `reject` and `dismiss` commands:
 *
 * * `ckeditor5-dev-agents reject <id> --reason "…"`: the finding is wrong. A decision records why.
 * * `ckeditor5-dev-agents dismiss <id>`: the finding is dropped without a decision.
 *
 * Both accept `--force` (continue when other fixes change the same files), `--config`, `--cwd`, `--target` and `--task`.
 */
export function parseResolveArguments(
	cliArguments: Array<string>,
	{ cwd = process.cwd() }: { cwd?: string } = {}
): ResolveFindingOptions {
	const { values, positionals } = parseArgs( {
		args: cliArguments,
		allowPositionals: true,
		options: {
			...COMMON_OPTIONS,
			reason: { type: 'string' },
			force: { type: 'boolean', default: false }
		}
	} );

	const [ action, id, ...rest ] = positionals;
	const reason = values.reason?.trim();

	if ( ( action !== 'reject' && action !== 'dismiss' ) || !id || rest.length ) {
		throw new Error( 'Usage: ckeditor5-dev-agents reject <id> --reason "…" | ckeditor5-dev-agents dismiss <id>' );
	}

	if ( action === 'reject' && !reason ) {
		throw new Error( 'Rejecting a finding needs a reason. Pass it with "--reason".' );
	}

	if ( action === 'dismiss' && values.reason ) {
		throw new Error( 'The "--reason" argument works only with "reject". A dismissed finding has no decision.' );
	}

	return {
		action,
		id,
		reason,
		force: values.force,
		...resolveCommonArguments( values, cwd )
	};
}

/**
 * Runs the `ckeditor5-dev-agents` command. Returns the exit code.
 */
export async function runCli( cliArguments: Array<string> ): Promise<number> {
	// `pnpm run <script> -- --target cs` passes the separator through, after the arguments of the script, if any.
	const args = cliArguments.filter( argument => argument !== '--' );

	try {
		if ( args[ 0 ] === 'reject' || args[ 0 ] === 'dismiss' ) {
			console.log( renderResolvedFinding( await resolveFinding( parseResolveArguments( args ) ) ) );

			return 0;
		}

		const { ok, targets } = await runTasks( parseArguments( args ) );

		console.log( `\n${ renderConsoleSummary( targets ) }` );

		if ( !ok ) {
			console.error( '\nSome tasks did not finish cleanly. See the problems above.' );
		}

		return ok ? 0 : 1;
	} catch ( error ) {
		console.error( getErrorMessage( error ) );

		return 1;
	}
}

function resolveCommonArguments(
	values: { config: string; cwd: string; target: Array<string>; task: Array<string> },
	cwd: string
): Pick<RunTasksOptions, 'configPath' | 'cwd' | 'targets' | 'tasks'> {
	return {
		configPath: upath.resolve( cwd, values.config ),
		cwd: upath.resolve( cwd, values.cwd ),
		targets: splitList( values.target ),
		tasks: splitList( values.task )
	};
}

/**
 * CI passes pipeline parameters as one string, so `--target=cs,ckbox` means the same as `--target=cs --target=ckbox`.
 */
function splitList( values: Array<string> ): Array<string> {
	return [ ...new Set( values.flatMap( value => value.split( ',' ) ).map( value => value.trim() ).filter( Boolean ) ) ];
}
