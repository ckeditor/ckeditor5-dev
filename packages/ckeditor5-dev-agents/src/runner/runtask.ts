/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { realpath } from 'node:fs/promises';
import upath from 'upath';
import { READ_ONLY_TOOLS, STATE_DIRECTORY } from '../constants.js';
import { createAgent, type AgentUsage } from '../agent/createagent.js';
import { findDecisions, getPriorDecisions } from '../state/decisions.js';
import { readTaskState, writeTaskState } from '../state/statestore.js';
import { renderReport } from '../report/renderreport.js';
import { compare } from '../utils/strings.js';
import { createTaskContext, createWritableTaskContext } from './createcontext.js';
import { createChangeTracker } from './changetracker.js';
import { fixUnit, type UnitOperations, type UnitRun } from './fixunit.js';
import { validateFindings } from './validatefindings.js';
import type { Finding, Target, TaskInstance, TaskSummary, TaskUnit } from '../types.js';

// How many units are judged at the same time, when the task does not set `concurrency`.
const DEFAULT_CONCURRENCY = 1;

export type RunTaskOptions = {
	instance: TaskInstance;
	target: Target;

	/**
	 * An absolute path to the target root.
	 */
	root: string;

	/**
	 * The base branch, used in the links of the report.
	 */
	branch: string;

	/**
	 * The date recorded in new findings and fixes, for example `2026-09-28`.
	 */
	today: string;

	/**
	 * Whether findings fixed in an earlier report pull request are dropped. They are when a published run starts
	 * a new report branch, because the previous pull request was already reviewed.
	 */
	pruneFixed: boolean;

	/**
	 * Receives the progress of the run, the tool calls of the agent, and the messages of `log()` in the hooks.
	 */
	log: ( message: string ) => void;
};

export type RunTaskResult = {
	summary: TaskSummary;

	/**
	 * Absolute paths of the files changed by kept fixes.
	 */
	files: Array<string>;
	open: Array<Finding>;
};

/**
 * Judges a bounded batch, applies verified fixes, and writes the state for the caller to publish.
 * Failed units and discarded fixes keep their previous baseline so the next run retries them.
 * Existing open findings remain until a human resolves them or a new report prunes reviewed fixes.
 */
export async function runTask( runOptions: RunTaskOptions ): Promise<RunTaskResult> {
	const { instance: { task, directory }, target, branch, today, pruneFixed, log } = runOptions;
	const { options, include, exclude } = task;

	// Git reports real paths. With a symbolic link in the root (for example `/tmp` on macOS), comparing them
	// with the given path would put every changed file outside of the root.
	const root = upath.normalize( await realpath( runOptions.root ) );
	const statePath = upath.join( root, STATE_DIRECTORY, task.id );

	const state = await readTaskState( statePath );
	const usage: AgentUsage = { cost: 0, tokens: 0 };

	// Judge and fix agents may report the same configuration problem; include it once.
	const agentWarnings = new Set<string>();
	const createPhaseAgent = ( tools: ReadonlyArray<string> ) => createAgent( {
		taskId: task.id,
		config: task.agent,
		taskDirectory: directory,
		cwd: root,
		tools,
		usage,
		log,
		warn: message => agentWarnings.add( message )
	} );

	const judgeAgent = createPhaseAgent( task.agent?.judgeTools ?? READ_ONLY_TOOLS );
	const fixAgent = createPhaseAgent( task.agent?.fixTools ?? [ ...READ_ONLY_TOOLS, 'edit', 'write' ] );
	const judgeContext = createTaskContext( { root, phase: 'judge', options, agent: judgeAgent, log } );
	const fixContext = createWritableTaskContext( { root, phase: 'fix', options, agent: fixAgent, log } );
	const verifyContext = createWritableTaskContext( { root, phase: 'verify', options, agent: fixAgent, log } );

	const shared: unknown = task.prepare ? await task.prepare( judgeContext ) : undefined;
	const units: Array<TaskUnit> = task.scope ?
		await task.scope( { ...judgeContext, shared, include, exclude } ) :
		( await judgeContext.repo.list( include, { ignore: exclude } ) ).map( path => ( { key: path, path } ) );

	const { decisions } = state;
	const operations: UnitOperations = {
		async contentHash( unit ) {
			return task.contentHash( { ...judgeContext, shared, unit } );
		},

		async judge( unit, fragment ) {
			const payload: unknown = await task.payload( { ...judgeContext, shared, unit } );
			const priorDecisions = getPriorDecisions( decisions, unit.key, fragment );
			const findings = validateFindings(
				await task.judge( { ...judgeContext, shared, unit, payload, priorDecisions } ),
				{ task, unit, fragment }
			);

			// A judge may return the same claim twice. It is reported once.
			return [ ...new Map( findings.map( finding => [ finding.fingerprint, finding ] ) ).values() ];
		},

		isRejected( finding ) {
			return findDecisions( decisions, finding ).some( decision => decision.fragment === finding.fragment );
		}
	};

	// The units are sorted by key, so the runs work through the changed units in a stable order.
	const unitRuns = new Map<string, UnitRun>();

	for ( const unit of units.toSorted( ( a, b ) => compare( a.key, b.key ) ) ) {
		if ( unitRuns.has( unit.key ) ) {
			throw new Error( `\`scope()\` returned the "${ unit.key }" unit more than once.` );
		}

		unitRuns.set( unit.key, { unit, fixes: new Map() } );
	}

	for ( const record of unitRuns.values() ) {
		try {
			record.current = { fragment: await operations.contentHash( record.unit ) };
		} catch ( error ) {
			record.error = `contentHash() failed: ${ ( error as Error ).message }`;
		}
	}

	// Units that left the scope (for example, a deleted guide) leave the baseline. Their open findings stay.
	const baseline = Object.fromEntries( Object.entries( state.baseline ).filter( ( [ key ] ) => unitRuns.has( key ) ) );
	const open = state.open.filter( finding => !pruneFixed || !finding.fix );
	const openFingerprints = new Set( open.map( finding => finding.fingerprint ) );
	const changedUnits = [ ...unitRuns.values() ].filter( ( { unit, current } ) => current && current.fragment !== baseline[ unit.key ] );
	const takenUnits = changedUnits.slice( 0, task.maxUnits );
	const deferred = changedUnits.length - takenUnits.length;

	log(
		`${ units.length } units in scope, ${ changedUnits.length } changed, ${ takenUnits.length } taken in this run` +
		( deferred ? ` (${ deferred } left for the next runs).` : '.' )
	);

	if ( takenUnits.length ) {
		log( `Judging ${ takenUnits.length } units...` );
	}

	// Judging never changes files, so units are judged in parallel. Fixes share one working tree, so they run
	// one at a time, after every unit is judged.
	const queue = [ ...takenUnits ];

	await Promise.all( Array.from( { length: task.concurrency ?? DEFAULT_CONCURRENCY }, async () => {
		for ( let record = queue.shift(); record; record = queue.shift() ) {
			try {
				record.judged = await operations.judge( record.unit, record.current!.fragment );
				record.current!.findings = record.judged;
			} catch ( error ) {
				record.error = ( error as Error ).message;
			}
		}
	} ) );

	const getActionable = ( record: UnitRun ) => {
		return record.judged ? record.current!.findings!.filter( finding => !operations.isRejected( finding ) ) : [];
	};
	const toFix = takenUnits.filter( record => getActionable( record ).length ).length;

	let files: Array<string> = [];

	if ( task.fix && toFix ) {
		const tracker = await createChangeTracker( root );
		const beforeFixes = await tracker.capture();
		const fixer = { ...operations, task, shared, root, units: unitRuns, tracker, fixContext, verifyContext };

		log( `Fixing ${ toFix } units...` );

		for ( const record of takenUnits ) {
			const actionable = getActionable( record );

			if ( !actionable.length ) {
				continue;
			}

			const outcome = await fixUnit( fixer, record, actionable );

			if ( outcome.status === 'kept' ) {
				const fix = { files: outcome.files.map( file => upath.relative( root, file ) ), fixedAt: today };

				for ( const [ affected, fingerprints ] of outcome.resolved ) {
					for ( const fingerprint of fingerprints ) {
						affected.fixes.set( fingerprint, fix );
					}
				}
			} else if ( outcome.status === 'discarded' ) {
				record.discarded = outcome;
			}
		}

		files = ( await tracker.collect( beforeFixes ) ).changed;
	}

	const judged = [ ...unitRuns.values() ].filter( record => record.judged );
	const counts = { newFindings: 0, alreadyOpen: 0, rejected: 0 };

	for ( const { unit, current, judged: findings, discarded } of judged ) {
		for ( const finding of findings! ) {
			if ( openFingerprints.has( finding.fingerprint ) ) {
				counts.alreadyOpen++;
			} else if ( operations.isRejected( finding ) ) {
				counts.rejected++;
			} else {
				const decision = findDecisions( decisions, finding ).at( -1 );

				counts.newFindings++;
				open.push( {
					...finding,
					reportedAt: today,
					previousDecision: decision && {
						file: decision.file,
						fragment: decision.fragment,
						finding: decision.finding,
						reason: decision.reason
					}
				} );
			}
		}

		if ( !discarded ) {
			baseline[ unit.key ] = current!.fragment;
		}
	}

	// Fix metadata uses the final observation, even when a later fix changed this unit again.
	const fixed = open.filter( finding => unitRuns.get( finding.unit )?.fixes.has( finding.fingerprint ) );

	for ( const finding of fixed ) {
		const record = unitRuns.get( finding.unit )!;

		finding.fix = { ...record.fixes.get( finding.fingerprint )!, fragment: record.current!.fragment };
	}

	// Written even when nothing was judged: the baseline may have lost units, fixed findings may have been pruned,
	// or someone may have edited `open.json` by hand.
	await writeTaskState( statePath, { baseline, open, report: renderReport( { task, target, branch, open } ) } );

	const errors = [ ...unitRuns.values() ]
		.filter( record => record.error !== undefined )
		.map( ( { unit, error } ) => ( { unit: unit.key, message: error! } ) );
	const discardedRuns = judged.filter( record => record.discarded );
	const summary: TaskSummary = {
		task: task.id,
		title: task.title,
		units: units.length,
		changed: changedUnits.length,
		judged: judged.length,
		deferred,
		...counts,
		fixed: fixed.length,
		discarded: discardedRuns.reduce( ( total, record ) => total + record.discarded!.findings, 0 ),
		changedFiles: files.length,
		open: open.filter( finding => !finding.fix ).length,
		errors: errors.length,
		problems: [
			...errors,
			...discardedRuns.map( ( { unit, discarded } ) => ( {
				unit: unit.key,
				message: `The fix was discarded. ${ discarded!.message }`
			} ) ),
			...[ ...state.warnings, ...agentWarnings ].map( message => ( { message } ) )
		],
		cost: usage.cost,
		tokens: usage.tokens
	};

	return { summary, files, open };
}
