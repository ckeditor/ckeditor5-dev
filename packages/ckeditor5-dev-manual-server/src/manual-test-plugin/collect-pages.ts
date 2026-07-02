/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { globSync } from 'node:fs';
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
	const manualPages = matchManualPageFiles( patterns, workspaceRoot )
		.map( toManualPageEntry );

	manualPages.sort( ( a, b ) => a.packageName.localeCompare( b.packageName ) || a.slug.localeCompare( b.slug ) );

	return new Map( manualPages.map( entry => [ entry.htmlFilePath, entry ] ) );
}

function matchManualPageFiles( patterns: Array<string>, workspaceRoot: string ): Array<string> {
	return patterns
		.map( pattern => `${ pattern.replace( /\/+$/, '' ) }/${ MANUAL_TESTS_DIRECTORY }**/*${ MANUAL_TEST_SUFFIX }` )
		.flatMap( pattern => globSync( pattern, { cwd: workspaceRoot } ).map( match => toPosixPath( match ) ) );
}

function toManualPageEntry( relativeFilePath: string ): ManualPageEntry {
	// The glob in `matchManualPageFiles` appends `/tests/manual/**/*.manual.html` to every package
	// root pattern, so each matched (posix-normalized) path is guaranteed to contain `/tests/manual/`.
	const separatorIndex = relativeFilePath.indexOf( `/${ MANUAL_TESTS_DIRECTORY }` );

	const packagePath = relativeFilePath.slice( 0, separatorIndex );
	const slugPath = relativeFilePath.slice( separatorIndex + MANUAL_TESTS_DIRECTORY.length + 1 );

	return {
		htmlFilePath: toPublicSpecifier( relativeFilePath ),
		packageName: packagePath.slice( packagePath.lastIndexOf( '/' ) + 1 ),
		slug: slugPath.slice( 0, -MANUAL_TEST_SUFFIX.length )
	};
}
