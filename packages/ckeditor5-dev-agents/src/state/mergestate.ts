/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { compare } from '../utils/strings.js';
import type { Finding } from '../types.js';

/**
 * Merges three versions of `open.json`: the common ancestor and the two sides of a merge. A finding removed on either
 * side, for example by `reject`, stays removed. A finding added on either side is kept. A finding changed on one side
 * takes that change; when both changed it, the `ours` version wins.
 */
export function mergeOpenFindings( base: Array<Finding>, ours: Array<Finding>, theirs: Array<Finding> ): Array<Finding> {
	const byFingerprint = ( findings: Array<Finding> ) => Object.fromEntries( findings.map( finding => [ finding.fingerprint, finding ] ) );
	const merged = mergeRecords( byFingerprint( base ), byFingerprint( ours ), byFingerprint( theirs ) );

	return Object.values( merged ).sort( ( a, b ) => compare( a.fingerprint, b.fingerprint ) );
}

/**
 * Merges three versions of `baseline.json`, the same way as `mergeOpenFindings()`. An entry removed on either side stays
 * removed, so its unit is judged again on the next run.
 */
export function mergeBaseline(
	base: Record<string, string>,
	ours: Record<string, string>,
	theirs: Record<string, string>
): Record<string, string> {
	const merged = mergeRecords( base, ours, theirs );

	return Object.fromEntries( Object.keys( merged ).sort( compare ).map( key => [ key, merged[ key ]! ] ) );
}

function mergeRecords<T>( base: Record<string, T>, ours: Record<string, T>, theirs: Record<string, T> ): Record<string, T> {
	const merged: Record<string, T> = {};

	for ( const key of new Set( [ ...Object.keys( base ), ...Object.keys( ours ), ...Object.keys( theirs ) ] ) ) {
		const inBase = key in base;
		const inOurs = key in ours;
		const inTheirs = key in theirs;

		if ( inBase && ( !inOurs || !inTheirs ) ) {
			continue;
		}

		if ( !inBase ) {
			merged[ key ] = inOurs ? ours[ key ]! : theirs[ key ]!;
		} else {
			merged[ key ] = isEqual( ours[ key ], base[ key ] ) ? theirs[ key ]! : ours[ key ]!;
		}
	}

	return merged;
}

function isEqual( a: unknown, b: unknown ): boolean {
	return JSON.stringify( a ) === JSON.stringify( b );
}
