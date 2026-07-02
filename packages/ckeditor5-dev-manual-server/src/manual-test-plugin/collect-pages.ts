/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stripLeadingSlash, toPosixPath, toPublicSpecifier } from '../utils.js';
import type { ManualPageEntry } from './types.js';

interface ParsedManualTestPath {
	packageName: string;
	slug: string;
}

const MANUAL_TEST_SUFFIX = '.manual.html';

/**
 * Discovers manual test pages. A manual test is a single full HTML document named
 * `<slug>.manual.html` located under a package's `tests/manual/` directory. Plain `.html`
 * files are treated as static fixtures and are never collected here.
 */
export function collectManualPages( patterns: Array<string>, workspaceRoot: string ): Map<string, ManualPageEntry> {
	const manualPages: Array<ManualPageEntry> = [];

	for ( const relativeFilePath of matchFiles( patterns, workspaceRoot ) ) {
		const parsedPath = parseManualTestPath( relativeFilePath );

		if ( !parsedPath ) {
			continue;
		}

		manualPages.push( {
			displayName: readTitle( resolve( workspaceRoot, relativeFilePath ) ) || humanizeSlug( parsedPath.slug ),
			htmlFilePath: toPublicSpecifier( relativeFilePath ),
			packageName: parsedPath.packageName,
			slug: parsedPath.slug
		} );
	}

	manualPages.sort( ( a, b ) => a.packageName.localeCompare( b.packageName ) || a.slug.localeCompare( b.slug ) );

	return new Map( manualPages.map( entry => [ entry.htmlFilePath, entry ] ) );
}

function parseManualTestPath( filePath: string ): ParsedManualTestPath | null {
	const normalizedFilePath = stripLeadingSlash( toPosixPath( filePath ) );
	const match = normalizedFilePath.match(
		/^(?:(.*?)\/)?([^/]+)\/tests\/manual\/(.+)\.manual\.html$/
	);

	if ( !match ) {
		return null;
	}

	return {
		packageName: match[ 2 ]!,
		slug: match[ 3 ]!
	};
}

function readTitle( absoluteFilePath: string ): string {
	const match = readFileSync( absoluteFilePath, 'utf8' ).match( /<title[^>]*>([\s\S]*?)<\/title>/i );

	return match ? match[ 1 ]!.trim() : '';
}

function humanizeSlug( slug: string ): string {
	return slug
		.split( '/' )
		.map( pathPart =>
			pathPart
				.split( '-' )
				.map( part => part.charAt( 0 ).toUpperCase() + part.slice( 1 ) )
				.join( ' ' )
		)
		.join( ' / ' );
}

function matchFiles( patterns: Array<string>, workspaceRoot: string ): Array<string> {
	return patterns
		.map( toManualPagePattern )
		.flatMap( pattern => globSync( pattern, { cwd: workspaceRoot } ).map( match => toPosixPath( match ) ) );
}

function toManualPagePattern( pattern: string ): string {
	if ( pattern.endsWith( MANUAL_TEST_SUFFIX ) ) {
		return pattern;
	}

	// `packages/*/tests/manual/**/*` -> `packages/*/tests/manual/**/*.manual.html`.
	return `${ pattern.replace( /\/+$/, '' ) }${ MANUAL_TEST_SUFFIX }`;
}
