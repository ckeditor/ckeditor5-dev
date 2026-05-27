/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { globSync } from 'node:fs';
import { stripLeadingSlash, toPosixPath, toPublicSpecifier } from '../utils.js';
import type { ManualPageEntry, ManualTestAssetExtension } from './types.js';

interface ParsedManualTestAssetPath {
	extension: ManualTestAssetExtension;
	packageName: string;
	packageRootPath: string;
	slug: string;
}

export function collectManualPages( patterns: Array<string>, workspaceRoot: string ): Map<string, ManualPageEntry> {
	const groupedFiles = new Map<string, Partial<Record<ManualTestAssetExtension, string>>>();
	const manualPages: Array<ManualPageEntry> = [];

	for ( const relativeFilePath of matchFiles( patterns, workspaceRoot ) ) {
		if ( relativeFilePath.includes( '/_utils/' ) ) {
			continue;
		}

		const parsedPath = parseManualTestAssetPath( relativeFilePath );

		if ( !parsedPath ) {
			continue;
		}

		const entryKey = `${ parsedPath.packageRootPath }/${ parsedPath.packageName }/${ parsedPath.slug }`;
		const matchedFiles = groupedFiles.get( entryKey ) || {};

		matchedFiles[ parsedPath.extension ] = relativeFilePath;
		groupedFiles.set( entryKey, matchedFiles );
	}

	for ( const matchedFiles of groupedFiles.values() ) {
		if ( !matchedFiles.html ) {
			continue;
		}

		const scriptFilePath = matchedFiles.ts || matchedFiles.js;

		if ( !scriptFilePath ) {
			continue;
		}

		const parsedPath = parseManualTestAssetPath( scriptFilePath )!;

		manualPages.push( {
			displayName: humanizeSlug( parsedPath.slug ),
			htmlFilePath: toPublicSpecifier( matchedFiles.html ),
			instructionsFilePath: matchedFiles.md ? toPublicSpecifier( matchedFiles.md ) : undefined,
			packageName: parsedPath.packageName,
			scriptFilePath: toPublicSpecifier( scriptFilePath ),
			slug: parsedPath.slug,
			source: parsedPath.packageRootPath == 'packages' ? 'commercial' : 'oss'
		} );
	}

	manualPages.sort( ( a, b ) => a.packageName.localeCompare( b.packageName ) || a.slug.localeCompare( b.slug ) );

	return new Map( manualPages.map( entry => [ entry.htmlFilePath, entry ] ) );
}

function parseManualTestAssetPath( filePath: string ): ParsedManualTestAssetPath | null {
	const normalizedFilePath = stripLeadingSlash( toPosixPath( filePath ) );
	const match = normalizedFilePath.match(
		/^(packages|external\/ckeditor5\/packages)\/([^/]+)\/tests\/manual\/(.+)\.(html|js|md|ts)$/
	);

	if ( !match ) {
		return null;
	}

	return {
		extension: match[ 4 ]! as ParsedManualTestAssetPath[ 'extension' ],
		packageName: match[ 2 ]!,
		packageRootPath: match[ 1 ]!,
		slug: match[ 3 ]!
	};
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
	return patterns.flatMap( pattern => globSync( pattern, { cwd: workspaceRoot } ).map( match => toPosixPath( match ) ) );
}
