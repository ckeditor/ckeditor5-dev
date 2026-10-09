/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { existsSync } from 'node:fs';
import upath from 'upath';
import { REPORT_BRANCH_PREFIX, STATE_DIRECTORY } from '../constants.js';
import { renderPullRequestBody, renderRunComment } from '../report/renderpullrequest.js';
import { getErrorMessage, plural } from '../utils/strings.js';
import { runTask, type RunTaskResult } from './runtask.js';
import type { GitWorkspace } from '../git/gitworkspace.js';
import type { GitHubClient } from '../github/githubclient.js';
import type { Target, TaskInstance, TaskSummary } from '../types.js';

export type TaskResult = {
	task: string;
	title: string;
	durationMs: number;

	/**
	 * Missing when the task failed before it finished. A task whose publishing failed has both.
	 */
	summary?: TaskSummary;
	failure?: string;
	pullRequestUrl?: string;
};

export type RunTargetOptions = {
	target: Target;

	/**
	 * Tasks requested explicitly. When empty, the tasks enabled in the target run.
	 */
	taskIds: Array<string>;
	workspace: GitWorkspace;

	/**
	 * Set for a published run. Without it, the results stay in the working tree.
	 */
	github?: GitHubClient;
	today: string;

	/**
	 * Receives the progress of the run, the tool calls of the agent, and the messages of `log()` in the hooks.
	 */
	log: ( message: string ) => void;

	/**
	 * Published run: linked from the run comment.
	 */
	buildUrl?: string;
};

/**
 * Runs the selected tasks against one target, in the working tree of the checkout.
 *
 * Both flows judge, fix, and write the state in the checkout. Kept fixes and the state stay in the files. A local run
 * stops there: nothing is committed or pushed. A published run does every task on its own report branch: it continues
 * the open report pull request or starts a new branch at the base branch, commits and pushes once, opens or updates
 * the pull request, and checks out the base branch again.
 */
export async function runTarget( options: RunTargetOptions ): Promise<Array<TaskResult>> {
	const { target, workspace, github, log } = options;

	// A task requested explicitly runs even when the target disables it, which is how a task is tried out before it is
	// enabled. The entry point checks that every requested task is configured in some target.
	const instances = [ ...target.tasks.values() ].filter( ( { task, enabled } ) => {
		return options.taskIds.length ? options.taskIds.includes( task.id ) : enabled;
	} );

	if ( !instances.length ) {
		log( `No tasks are enabled for the "${ target.name }" target. Skipping.` );

		return [];
	}

	const root = upath.join( workspace.path, target.root );

	if ( !existsSync( root ) ) {
		throw new Error( `The root of the "${ target.name }" target, "${ target.root }", does not exist in the checkout.` );
	}

	const results: Array<TaskResult> = [];

	for ( const instance of instances ) {
		const { task } = instance;
		const startedAt = Date.now();
		let result: Omit<TaskResult, 'task' | 'title' | 'durationMs'>;

		log( `Running the "${ task.id }" task...` );

		// A failing task does not stop the other tasks of the target.
		try {
			result = github ?
				await publishTask( options, github, root, instance ) :
				{ summary: ( await executeTask( options, root, instance, false ) ).summary };
		} catch ( error ) {
			result = { failure: getErrorMessage( error ) };
		}

		if ( result.failure ) {
			log( `  The "${ task.id }" task failed: ${ result.failure }` );
		}

		results.push( { task: task.id, title: task.title, durationMs: Date.now() - startedAt, ...result } );
	}

	return results;
}

export function getReportBranch( taskId: string, target: Pick<Target, 'name'>, branch: string ): string {
	return `${ REPORT_BRANCH_PREFIX }/${ taskId }/${ target.name }/${ branch }`;
}

function executeTask( options: RunTargetOptions, root: string, instance: TaskInstance, pruneFixed: boolean ): Promise<RunTaskResult> {
	const { target, workspace, today, log } = options;

	return runTask( { instance, target, root, branch: workspace.branch, today, pruneFixed, log: message => log( `  ${ message }` ) } );
}

async function publishTask(
	options: RunTargetOptions,
	github: GitHubClient,
	root: string,
	instance: TaskInstance
): Promise<Omit<TaskResult, 'task' | 'title' | 'durationMs'>> {
	const { target, workspace, today, buildUrl, log } = options;
	const { task } = instance;
	const { branch } = workspace;
	const reportBranch = getReportBranch( task.id, target, branch );
	let pullRequest = await github.findOpenPullRequest( { slug: target.slug, head: reportBranch } );
	let saved: RunTaskResult | undefined;
	let failure: string | undefined;

	try {
		await workspace.checkoutReportBranch( { name: reportBranch, continueExisting: Boolean( pullRequest ) } );
		log( pullRequest ?
			`  Continuing the open report pull request: ${ pullRequest.html_url }` :
			`  Starting the "${ reportBranch }" report branch at "${ branch }".`
		);

		saved = await executeTask( options, root, instance, !pullRequest );

		const paths = [
			upath.join( target.root, STATE_DIRECTORY, task.id ),
			...saved.files.map( file => upath.relative( workspace.path, file ) )
		];
		const judged = saved.summary.judged;
		const committed = await workspace.commit( paths, `${ task.title }: ${ judged } ${ plural( judged, 'unit' ) } judged.` );

		if ( committed ) {
			await workspace.push();

			const fixed = saved.open.filter( finding => finding.fix ).length;
			const body = renderPullRequestBody( { task, target, branch, reportBranch, open: saved.open.length - fixed, fixed } );

			if ( pullRequest ) {
				await github.updatePullRequest( { slug: target.slug, number: pullRequest.number, body } );
			} else {
				pullRequest = await github.createPullRequest( {
					slug: target.slug,
					head: reportBranch,
					base: branch,
					title: `${ task.title }: ${ target.name } (${ branch })`,
					body
				} );
				log( `  Opened the report pull request: ${ pullRequest.html_url }` );
			}

			await github.createComment( {
				slug: target.slug,
				number: pullRequest.number,
				body: renderRunComment( { today, buildUrl, summary: saved.summary } )
			} );
		} else {
			log( '  Nothing new. Nothing was pushed.' );
		}
	} catch ( error ) {
		failure = getErrorMessage( error );
	} finally {
		try {
			await workspace.returnToBase();
		} catch ( error ) {
			// Preserve both failures when cleanup also fails, as well as any completed audit summary.
			const message = `Returning to the base branch failed: ${ getErrorMessage( error ) }`;

			failure = failure ? `${ failure }\n${ message }` : message;
		}
	}

	return saved ? { summary: saved.summary, failure, pullRequestUrl: pullRequest?.html_url } : { failure };
}
