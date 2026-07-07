/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { globSync } from 'node:fs';
import { basename } from 'node:path';
import { toPosixPath, toPublicSpecifier } from '../utils.js';
import type { ManualPageEntry } from './types.js';

const MANUAL_TESTS_DIRECTORY = 'tests/manual/';
const MANUAL_TEST_SUFFIX = '.manual.html';

/**
 * Discovers manual test pages. A manual test is a single full HTML document named
 * `<slug>.manual.html` located under a package's `tests/manual/` directory. Plain `.html`
 * files are treated as static fixtures and are never collected here.
 *
 * The `patterns` are package root globs, for example `packages/*`.
 */
export function collectManualPages( patterns: Array<string>, workspaceRoot: string ): Map<string, ManualPageEntry> {
	const manualPages: Array<[ string, ManualPageEntry ]> = matchManualPageFiles( patterns, workspaceRoot )
		.map( ( relativeFilePath: string ) => toManualPageEntry( relativeFilePath, workspaceRoot ) )
		// @ts-expect-error Remove when we upgrade TypeScript and bump `target`.
		.toSorted( ( a, b ) => a.packageName.localeCompare( b.packageName ) || a.slug.localeCompare( b.slug ) )
		.map( ( entry: ManualPageEntry ) => [ entry.htmlFilePath, entry ] );

	return new Map( manualPages );
}

function matchManualPageFiles( patterns: Array<string>, workspaceRoot: string ): Array<string> {
	return patterns
		.map( pattern => `${ pattern.replace( /\/+$/, '' ) }/${ MANUAL_TESTS_DIRECTORY }**/*${ MANUAL_TEST_SUFFIX }` )
		.flatMap( pattern => globSync( pattern, { cwd: workspaceRoot } ).map( match => toPosixPath( match ) ) );
}

function toManualPageEntry( relativeFilePath: string, workspaceRoot: string ): ManualPageEntry {
	const directoryStartIndex = relativeFilePath.startsWith( MANUAL_TESTS_DIRECTORY ) ?
		0 :
		relativeFilePath.indexOf( `/${ MANUAL_TESTS_DIRECTORY }` ) + 1;
	const packagePath = relativeFilePath.slice( 0, Math.max( directoryStartIndex - 1, 0 ) );
	const slugPath = relativeFilePath.slice( directoryStartIndex + MANUAL_TESTS_DIRECTORY.length );

	return {
		htmlFilePath: toPublicSpecifier( relativeFilePath ),
		packageName: packagePath ? packagePath.slice( packagePath.lastIndexOf( '/' ) + 1 ) : basename( workspaceRoot ),
		slug: slugPath.slice( 0, -MANUAL_TEST_SUFFIX.length )
	};
}
