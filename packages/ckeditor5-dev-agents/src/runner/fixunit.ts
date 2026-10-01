/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { posix } from 'node:path';
import upath from 'upath';
import { isOutside } from '../utils/files.js';
import type { ChangeTracker } from './changetracker.js';
import type { AppliedFix, Finding, Task, TaskUnit, WritableTaskContext } from '../types.js';

/**
 * What the run does with one unit, shared by judging and by checking fixes.
 */
export type UnitOperations = {
	contentHash( unit: TaskUnit ): Promise<string>;

	/**
	 * Returns the validated findings of `judge()` about the unit, without duplicates.
	 */
	judge( unit: TaskUnit, fragment: string ): Promise<Array<Finding>>;

	/**
	 * Whether a decision that still holds rejects the finding.
	 */
	isRejected( finding: Finding ): boolean;
};

/**
 * One unit in a run. `current` follows accepted fixes, including fixes made while processing another unit. Only
 * the units selected for this run are `judged` and may advance their baseline. Checking a deferred unit during a fix
 * does not select it.
 */
export type UnitRun = {
	unit: TaskUnit;
	current?: { fragment: string; findings?: Array<Finding> };
	judged?: Array<Finding>;
	error?: string;
	discarded?: { message: string; findings: number };
	fixes: Map<string, Omit<AppliedFix, 'fragment'>>;
};

export type FixOutcome =
	{ status: 'none' } |
	{ status: 'discarded'; message: string; findings: number } |
	{ status: 'kept'; files: Array<string>; resolved: Map<UnitRun, Set<string>> };

export type FixUnitOptions = UnitOperations & {
	task: Task;
	shared: unknown;
	root: string;
	units: Map<string, UnitRun>;
	tracker: ChangeTracker;
	fixContext: WritableTaskContext;
	verifyContext: WritableTaskContext;
};

/**
 * Fixes one unit transactionally. Every affected unit is checked, including units whose hash depends on
 * files outside their own path. A later fix must preserve the accepted judgments of earlier fixes.
 */
export async function fixUnit( runner: FixUnitOptions, record: UnitRun, actionable: Array<Finding> ): Promise<FixOutcome> {
	const { task, shared, tracker, fixContext, verifyContext } = runner;
	const { unit } = record;
	const snapshot = await tracker.capture();

	try {
		await step( '`fix()`', () => task.fix!( { ...fixContext, shared, unit, findings: actionable } ) );

		const initial = await step( 'Inspecting the fix', () => tracker.collect( snapshot ) );

		assertAllowedChanges( runner, initial );

		if ( !initial.changed.length ) {
			return { status: 'none' };
		}

		await step( '`verify()`', () => task.verify?.( { ...verifyContext, shared, unit } ) );

		const final = await step( 'Inspecting the fix', () => tracker.collect( snapshot ) );

		assertAllowedChanges( runner, final );

		const affected = await step( 'Judging the fixed unit', async () => {
			// `contentHash()` defines what a unit depends on, which may include files outside its `path`. Every unit
			// whose hash changed is affected by the fix and is checked, even one that this run did not take or judge.
			const fragments = new Map<UnitRun, string>();

			for ( const candidate of runner.units.values() ) {
				const fragment = await runner.contentHash( candidate.unit );

				if ( candidate === record || fragment !== candidate.current?.fragment ) {
					fragments.set( candidate, fragment );
				}
			}

			const unjudged = [ ...fragments.keys() ].filter( candidate => !candidate.current?.findings );

			if ( unjudged.length ) {
				// An affected unit that was not judged in this run has no findings to compare with. Judge it on the content
				// from before the fix: take the fix out of the working tree, judge, and put the fix back, even when judging
				// fails. `shared` from `prepare()` is reused, so it must not depend on the files the fix changes.
				const proposed = await tracker.capture();

				await tracker.restore( snapshot, final.changed );

				try {
					for ( const candidate of unjudged ) {
						const fragment = await runner.contentHash( candidate.unit );

						candidate.current = { fragment, findings: await runner.judge( candidate.unit, fragment ) };
					}
				} finally {
					await tracker.restore( proposed, final.changed );
				}
			}

			return fragments;
		} );

		const observations = new Map<UnitRun, { fragment: string; findings: Array<Finding> }>();
		const resolved = new Map<UnitRun, Set<string>>();

		for ( const [ candidate, fragment ] of affected ) {
			const findings = await step( 'Judging the fixed unit', () => runner.judge( candidate.unit, fragment ) );
			const before = candidate.current!.findings!;
			const known = new Set( before.filter( finding => !runner.isRejected( finding ) ).map( finding => finding.fingerprint ) );

			// A decision holds only for the content it was made about, and the fix changes that content. A finding rejected
			// before the fix is not introduced by it, so it does not discard the fix.
			const rejected = new Set( before.filter( finding => runner.isRejected( finding ) ).map( finding => finding.fingerprint ) );
			const introduced = findings.filter( finding => {
				return !known.has( finding.fingerprint ) && !rejected.has( finding.fingerprint ) && !runner.isRejected( finding );
			} );

			if ( introduced.length ) {
				throw new Error( `The fix introduced new findings: ${ introduced.map( finding => finding.ruleId ).join( ', ' ) }.` );
			}

			const remaining = new Set( findings.map( finding => finding.fingerprint ) );

			resolved.set( candidate, new Set( [ ...known ].filter( fingerprint => !remaining.has( fingerprint ) ) ) );
			observations.set( candidate, { fragment, findings } );
		}

		if ( !actionable.some( finding => resolved.get( record )!.has( finding.fingerprint ) ) ) {
			throw new Error( 'The fix did not resolve any finding.' );
		}

		for ( const [ candidate, observation ] of observations ) {
			candidate.current = observation;
		}

		return { status: 'kept', files: final.changed, resolved };
	} catch ( error ) {
		// Every failure, including one of the tracker, undoes the fix. When undoing fails too, the error stops the task:
		// later units must not be judged or fixed in a working tree in an unknown state.
		await tracker.restore( snapshot, ( await tracker.collect( snapshot ) ).changed );

		return { status: 'discarded', message: ( error as Error ).message, findings: actionable.length };
	}
}

// Prepends the step to the message when it fails. The checks of the harness throw outside of a step, because their
// messages are complete on their own.
async function step<T>( label: string, callback: () => T | Promise<T> ): Promise<T> {
	try {
		return await callback();
	} catch ( error ) {
		throw new Error( `${ label } failed: ${ ( error as Error ).message }`, { cause: error } );
	}
}

function assertAllowedChanges( runner: FixUnitOptions, { changed, headMoved }: { changed: Array<string>; headMoved: boolean } ): void {
	if ( headMoved ) {
		throw new Error( 'The fix created commits. Only the harness may commit.' );
	}

	const outside = changed
		.map( file => upath.relative( runner.root, file ) )
		.filter( file => isOutside( file ) || !runner.task.writes!.some( pattern => posix.matchesGlob( file, pattern ) ) );

	if ( outside.length ) {
		throw new Error( `The fix changed files outside \`writes\`: ${ outside.map( file => `\`${ file }\`` ).join( ', ' ) }.` );
	}
}
