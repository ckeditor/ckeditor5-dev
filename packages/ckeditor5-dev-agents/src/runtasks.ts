/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { loadConfig } from './config/loadconfig.js';
import { selectTargets } from './config/selecttargets.js';
import { openWorkspace } from './git/gitworkspace.js';
import { createGitHubClient } from './github/githubclient.js';
import { runTarget, type TaskResult } from './runner/runtarget.js';

export type RunTasksOptions = {

	/**
	 * An absolute path to the directory with `tasks/` and `targets/`.
	 */
	configPath: string;

	/**
	 * An absolute path to a directory inside the checkout to run in. The checkout is prepared by the caller: cloned,
	 * with the dependencies installed, and with the base branch checked out.
	 */
	cwd: string;

	/**
	 * The targets to run. When empty, every target whose `slug` matches the `origin` of the checkout.
	 */
	targets: Array<string>;

	/**
	 * The tasks to run. When empty, the tasks each target enables.
	 */
	tasks: Array<string>;

	/**
	 * Set for a published run: a GitHub token that can open pull requests and comment on them in every target.
	 * The run commits and pushes the state and the fixes, and opens or updates the report pull requests. Without it,
	 * everything stays in the working tree. Pushing uses the credentials of the checkout.
	 */
	token?: string;
	author: { name: string; email: string };

	/**
	 * Linked from the comments of published runs.
	 */
	buildUrl?: string;

	/**
	 * Receives the progress of the run, the tool calls of the agent, and the messages of `log()` in the hooks.
	 * Default: `console.log`. The final summary is not logged.
	 */
	log?: ( message: string ) => void;
};

export type TargetResult = {
	target: string;
	branch: string;
	publish: boolean;

	/**
	 * Empty when the target has no enabled tasks.
	 */
	results: Array<TaskResult>;
	error?: string;
};

/**
 * Runs the tasks against the targets in the checkout. The result is not `ok` when a task or a unit failed. Findings
 * never make a run fail.
 */
export async function runTasks( options: RunTasksOptions ): Promise<{ ok: boolean; targets: Array<TargetResult> }> {
	const { log = console.log, tasks: taskIds, token } = options;
	const targets = await loadConfig( options.configPath );
	const workspace = await openWorkspace( { cwd: options.cwd, author: options.author } );
	const selectedTargets = selectTargets( targets, { originSlug: workspace.originSlug, names: options.targets, taskIds } );
	const publish = Boolean( token );
	const github = publish ? createGitHubClient( token! ) : undefined;
	const today = new Date().toISOString().slice( 0, 10 );
	const { branch } = workspace;
	const results: Array<TargetResult> = [];

	if ( publish ) {
		await workspace.assertPublishable();
	}

	for ( const target of selectedTargets ) {
		const targetResult = { target: target.name, branch, publish };

		log( `\n○ Running "${ target.name }" (${ target.slug }, ${ branch })...` );

		try {
			results.push( {
				...targetResult,
				results: await runTarget( {
					target,
					taskIds,
					workspace,
					github,
					today,
					buildUrl: options.buildUrl,
					log: message => log( `  ${ message }` )
				} )
			} );
		} catch ( error ) {
			log( `  Running "${ target.name }" failed: ${ ( error as Error ).message }` );
			results.push( { ...targetResult, results: [], error: ( error as Error ).message } );
		}
	}

	const ok = results.every( ( { results: taskResults, error } ) => {
		return !error && taskResults.every( ( { failure, summary } ) => !failure && !summary?.errors );
	} );

	return { ok, targets: results };
}
