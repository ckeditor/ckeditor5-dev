/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import upath from 'upath';
import { loadConfig } from '../config/loadconfig.js';
import { selectTargets } from '../config/selecttargets.js';
import { REPORT_BRANCH_PREFIX, STATE_DIRECTORY } from '../constants.js';
import { openWorkspace, type GitWorkspace } from '../git/gitworkspace.js';
import { renderReport } from '../report/renderreport.js';
import { getDecisionFileName, renderDecision } from '../state/decisions.js';
import { readTaskState, writeTaskState, type TaskState } from '../state/statestore.js';
import { getReportBranch } from '../runner/runtarget.js';
import { getFindingId } from '../runner/validatefindings.js';
import type { Finding, Target, Task } from '../types.js';

export type ResolveFindingOptions = {

	/**
	 * `reject`: the finding is wrong. A decision records why, so it is not reported again while the content stays
	 * the same. `dismiss`: the finding is dropped without a decision, so it may be reported again.
	 */
	action: 'reject' | 'dismiss';

	/**
	 * The short ID of the finding from the report, or a prefix of it.
	 */
	id: string;

	/**
	 * Why the finding is wrong. Required to reject it.
	 */
	reason?: string;

	/**
	 * Continue when reverting the fix also undoes other fixes that changed the same files.
	 */
	force: boolean;

	/**
	 * An absolute path to the directory with `tasks/` and `targets/`.
	 */
	configPath: string;

	/**
	 * An absolute path to a directory inside the checkout.
	 */
	cwd: string;
	targets: Array<string>;
	tasks: Array<string>;
};

export type ResolvedFinding = {
	action: 'reject' | 'dismiss';
	target: string;
	finding: Finding;

	/**
	 * The path of the decision file, relative to the repository root. Only when rejecting.
	 */
	decisionFile?: string;

	/**
	 * The files restored, relative to the repository root.
	 */
	revertedFiles: Array<string>;

	/**
	 * Other findings whose fixes were undone. They stay open, and the next run judges and fixes them again.
	 */
	reopened: Array<Finding>;
};

type TaskStateEntry = {
	target: Target;

	// The task under the name of the instance.
	task: Task;
	statePath: string;
	state: TaskState;
};

type AffectedFix = {
	entry: TaskStateEntry;
	finding: Finding;

	/**
	 * The files of the fix, relative to the repository root.
	 */
	files: Array<string>;
};

/**
 * Rejects or dismisses one finding in the working tree of the checkout, by its short ID:
 *
 * 1. If the finding has a fix, every file of the fix is restored: from the base branch on a report branch,
 *    from `HEAD` otherwise.
 * 2. If other fixes changed any of those files, they are lost too. Without `force`, nothing changes and the error
 *    lists them. With `force`, all their files are restored as well, their findings lose the fix, and their units are
 *    judged and fixed again by the next run.
 * 3. The finding leaves `open.json`. When rejecting, a decision file records the reason.
 * 4. `report.md` is regenerated. The changes stay in the working tree for a human to review and commit.
 */
export async function resolveFinding( options: ResolveFindingOptions ): Promise<ResolvedFinding> {
	const { tasks: taskIds } = options;
	const targets = await loadConfig( options.configPath );
	const workspace = await openWorkspace( { cwd: options.cwd } );
	const selectedTargets = selectTargets( targets, { originSlug: workspace.originSlug, names: options.targets, taskIds } );
	// Selection limits the requested finding, but rollback must see overlapping fixes from every configured target.
	const entries = await readStates( workspace, [ ...targets.values() ].filter( target => target.slug === workspace.originSlug ) );
	const candidates = entries.filter( entry => selectedTargets.includes( entry.target ) &&
		( !taskIds.length || taskIds.includes( entry.task.id ) ) );
	const { entry, finding } = findFinding( candidates, options.id );
	const reportBranch = parseReportBranch( workspace.branch );

	// A report branch holds the fixes of one task in one target. Reverting the fix of another one there would restore
	// files that the branch does not change, and would write the state of that task into the wrong pull request.
	if ( reportBranch && ( reportBranch.task !== entry.task.id || reportBranch.target !== entry.target.name ) ) {
		throw new Error(
			`The [${ finding.id }] finding belongs to the "${ entry.task.id }" task in the "${ entry.target.name }" target, ` +
			`but the "${ workspace.branch }" report branch is checked out. ` +
			`Check out "${ getReportBranch( entry.task.id, entry.target, reportBranch.base ) }" first.`
		);
	}

	const affected = getAffectedFixes( entries, finding );
	const others = affected.filter( item => item.finding !== finding );

	if ( others.length && !options.force ) {
		throw new Error( [
			`Reverting the fix of [${ finding.id }] also undoes these fixes, because they changed the same files:`,
			...others.map( ( { finding: other, files } ) => {
				return `  [${ other.id }] ${ describe( other ) } (${ other.task }): ${ files.join( ', ' ) }`;
			} ),
			'Nothing was changed. Re-run with "--force" to revert them too. Their findings then stay open, ' +
				'and the next run judges and fixes them again.'
		].join( '\n' ) );
	}

	// On a report branch, the fix is a change against its base branch, which the report links to. Anywhere else
	// (a local run), the fix is not committed, so `HEAD` has the content from before it.
	const baseBranch = reportBranch?.base;
	const revertedFiles = [ ...new Set( affected.flatMap( item => item.files ) ) ].sort();

	// Restoring from `HEAD` reverts nothing when the fix is already committed, for example in a report branch checked
	// out as a detached `HEAD`, or after committing the fixes of a local run.
	if ( revertedFiles.length && !baseBranch && !( await workspace.hasChanges( revertedFiles ) ) ) {
		throw new Error(
			`The fix of [${ finding.id }] is already committed, so restoring its files from HEAD would change nothing. ` +
			'Check out the report branch by its name, or resolve the findings of a local run before committing its fixes.'
		);
	}

	if ( revertedFiles.length ) {
		await workspace.restore( revertedFiles, baseBranch ? await getRestoreRef( workspace, baseBranch ) : 'HEAD' );
	}

	for ( const item of affected ) {
		delete item.entry.state.baseline[ item.finding.unit ];
		delete item.finding.fix;
	}

	entry.state.open = entry.state.open.filter( candidate => candidate !== finding );

	const decisionFile = options.action === 'reject' ? await writeDecision( entry, finding, options.reason!, workspace ) : undefined;

	for ( const { target, task, statePath, state: { baseline, open } } of new Set( [ entry, ...affected.map( item => item.entry ) ] ) ) {
		const report = renderReport( { task, target, branch: baseBranch ?? workspace.branch, open } );

		await writeTaskState( statePath, { baseline, open, report } );
	}

	return {
		action: options.action,
		target: entry.target.name,
		finding,
		decisionFile,
		revertedFiles,
		reopened: others.map( item => item.finding )
	};
}

/**
 * Renders what `resolveFinding()` did, as plain text for the console.
 */
export function renderResolvedFinding( result: ResolvedFinding ): string {
	const { finding } = result;
	const verb = result.action === 'reject' ? 'Rejected' : 'Dismissed';
	const lines = [ `${ verb } [${ finding.id }] ${ describe( finding ) } (${ finding.task }, ${ result.target }).` ];

	if ( result.decisionFile ) {
		lines.push( `  Decision  ${ result.decisionFile }` );
	}

	lines.push( `  Reverted  ${ result.revertedFiles.length ? result.revertedFiles.join( ', ' ) : 'nothing (the finding had no fix)' }` );

	for ( const item of result.reopened ) {
		lines.push( `  Reopened  [${ item.id }] ${ describe( item ) } (${ item.task }), fixed again on the next run` );
	}

	lines.push( '', 'Nothing was committed. Review the changes with "git status" and "git diff HEAD", then commit them.' );

	return lines.join( '\n' );
}

async function readStates( workspace: GitWorkspace, targets: Array<Target> ): Promise<Array<TaskStateEntry>> {
	const entries: Array<TaskStateEntry> = [];

	for ( const target of targets ) {
		for ( const { task } of target.tasks.values() ) {
			const statePath = upath.join( workspace.path, target.root, STATE_DIRECTORY, task.id );

			entries.push( { target, task, statePath, state: await readTaskState( statePath ) } );
		}
	}

	return entries;
}

function findFinding( entries: Array<TaskStateEntry>, id: string ): { entry: TaskStateEntry; finding: Finding } {
	const prefix = id.trim().toLowerCase().replace( /^\[|\]$/g, '' );
	const matches = entries.flatMap( entry => {
		return entry.state.open
			.filter( finding => getFindingId( finding.fingerprint ).startsWith( prefix ) )
			.map( finding => ( { entry, finding } ) );
	} );

	if ( !prefix || !matches.length ) {
		throw new Error( `No open finding has the "${ id }" ID.` );
	}

	if ( matches.length > 1 ) {
		throw new Error( [
			`The "${ id }" ID matches more than one finding. Use more characters of the ID:`,
			...matches.map( ( { finding } ) => `  [${ getFindingId( finding.fingerprint ) }] ${ describe( finding ) } (${ finding.task })` )
		].join( '\n' ) );
	}

	return matches[ 0 ]!;
}

/**
 * Returns the fix of the finding, and every other fix that shares a file with the ones found so far. Restoring a shared
 * file undoes all of them, so each of them is undone completely.
 */
function getAffectedFixes( entries: Array<TaskStateEntry>, finding: Finding ): Array<AffectedFix> {
	const fixed = entries.flatMap( entry => entry.state.open
		.filter( item => item.fix )
		.map( item => ( { entry, finding: item, files: item.fix!.files.map( file => upath.join( entry.target.root, file ) ) } ) ) );

	const start = fixed.find( item => item.finding === finding );

	if ( !start ) {
		return [];
	}

	const affected = [ start ];
	const files = new Set( start.files );

	for ( let index = 0; index < affected.length; index++ ) {
		for ( const item of fixed ) {
			if ( !affected.includes( item ) && item.files.some( file => files.has( file ) ) ) {
				affected.push( item );
				item.files.forEach( file => files.add( file ) );
			}
		}
	}

	return affected;
}

/**
 * Splits the name of a report branch, `ai-tasks/<task>/<target>/<base branch>`, into its parts.
 */
function parseReportBranch( branch: string ): { task: string; target: string; base: string } | undefined {
	const [ prefix, task, target, ...base ] = branch.split( '/' );

	return prefix === REPORT_BRANCH_PREFIX && task && target && base.length ? { task, target, base: base.join( '/' ) } : undefined;
}

async function getRestoreRef( workspace: GitWorkspace, baseBranch: string ): Promise<string> {
	for ( const ref of [ `origin/${ baseBranch }`, baseBranch ] ) {
		if ( await workspace.refExists( ref ) ) {
			return ref;
		}
	}

	throw new Error( `The "${ baseBranch }" base branch of the "${ workspace.branch }" report branch does not exist. Fetch it first.` );
}

async function writeDecision( entry: TaskStateEntry, finding: Finding, reason: string, workspace: GitWorkspace ): Promise<string> {
	const directory = upath.join( entry.statePath, 'decisions' );
	const name = getDecisionFileName( finding );

	let path = upath.join( directory, `${ name }.yml` );

	for ( let suffix = 2; existsSync( path ); suffix++ ) {
		path = upath.join( directory, `${ name }-${ suffix }.yml` );
	}

	await mkdir( directory, { recursive: true } );
	await writeFile( path, renderDecision( finding, reason ) );

	return upath.relative( workspace.path, path );
}

function describe( finding: Finding ): string {
	return `${ finding.ruleId }${ finding.discriminator ? ` (${ finding.discriminator })` : '' } in ${ finding.unit }`;
}
