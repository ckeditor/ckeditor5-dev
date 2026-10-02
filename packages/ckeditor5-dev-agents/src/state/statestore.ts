/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import upath from 'upath';
import { loadDecisions } from './decisions.js';
import { readIfExists } from '../utils/files.js';
import { compare } from '../utils/strings.js';
import type { Decision, Finding } from '../types.js';

export type TaskState = {
	baseline: Record<string, string>;
	open: Array<Finding>;
	decisions: Array<Decision>;
	warnings: Array<string>;
};

/**
 * Reads the state of one task: `baseline.json`, `open.json` and `decisions/*.yml`. Missing files mean
 * an empty state, which is what the first run of a task sees.
 */
export async function readTaskState( taskStatePath: string ): Promise<TaskState> {
	const baseline = await readJson( taskStatePath, 'baseline.json', {} );
	const open = await readJson( taskStatePath, 'open.json', [] );
	const { decisions, warnings } = await loadDecisions( upath.join( taskStatePath, 'decisions' ) );

	if ( !baseline || typeof baseline !== 'object' || Array.isArray( baseline ) ) {
		throw new Error( 'The "baseline.json" file must contain an object.' );
	}

	if ( !Array.isArray( open ) ) {
		throw new Error( 'The "open.json" file must contain an array.' );
	}

	return { baseline: baseline as Record<string, string>, open, decisions, warnings };
}

/**
 * Writes the state of one task. Keys and findings are sorted, so the diff shows only what really changed.
 */
export async function writeTaskState(
	taskStatePath: string,
	{ baseline, open, report }: { baseline: Record<string, string>; open: Array<Finding>; report: string }
): Promise<void> {
	const sortedBaseline = Object.fromEntries( Object.keys( baseline ).sort().map( key => [ key, baseline[ key ] ] ) );
	const sortedOpen = open.toSorted( ( a, b ) => compare( a.fingerprint, b.fingerprint ) );

	await mkdir( taskStatePath, { recursive: true } );
	await writeFile( upath.join( taskStatePath, 'baseline.json' ), toJson( sortedBaseline ) );
	await writeFile( upath.join( taskStatePath, 'open.json' ), toJson( sortedOpen ) );
	await writeFile( upath.join( taskStatePath, 'report.md' ), report );
}

async function readJson( directory: string, file: string, defaultValue: unknown ): Promise<unknown> {
	const content = await readIfExists( () => readFile( upath.join( directory, file ), 'utf8' ) );

	if ( content === null ) {
		return defaultValue;
	}

	try {
		return JSON.parse( content );
	} catch ( error ) {
		throw new Error( `The "${ file }" file is not valid JSON: ${ ( error as Error ).message }`, { cause: error } );
	}
}

function toJson( value: unknown ): string {
	return JSON.stringify( value, null, '\t' ) + '\n';
}
