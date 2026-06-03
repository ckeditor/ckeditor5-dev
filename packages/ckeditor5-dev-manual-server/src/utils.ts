/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { resolve, relative, isAbsolute } from 'node:path';
import { globSync, readFileSync } from 'node:fs';

/**
 * Stringifies the values of the given object.
 */
export function stringifyValues( obj: Record<string, unknown> ): Record<string, string> {
	return Object.fromEntries(
		Object
			.entries( obj )
			.map( ( [ key, value ] ) => [ key, JSON.stringify( value ) ] )
	);
}

/**
 * Returns package names that should be pre-bundled by the manual test server.
 */
export function getOptimizedPackageIncludes( packageJsonGlobs: Array<string> ): Array<string> {
	const packageNames = globSync( packageJsonGlobs, { cwd: process.cwd() } )
		.map( packageJsonPath => {
			const resolvedPath = resolve( process.cwd(), packageJsonPath );
			const packageJson = JSON.parse( readFileSync( resolvedPath, 'utf8' ) );

			return packageJson.name;
		} )
		.sort();

	return [ ...new Set( packageNames ) ];
}

export function toPublicFilePath( filePath: string, workspaceRoot: string ): string {
	const relativeFilePath = relative( workspaceRoot, filePath );

	if ( !relativeFilePath.startsWith( '..' ) && !isAbsolute( relativeFilePath ) ) {
		return toPublicSpecifier( relativeFilePath );
	}

	return `/@fs/${ toPosixPath( filePath ) }`;
}

export function toPublicSpecifier( relativeFilePath: string ): string {
	return `/${ stripLeadingSlash( toPosixPath( relativeFilePath ) ) }`;
}

export function toPosixPath( value: string ): string {
	return value.replace( /\\/g, '/' );
}

export function stripLeadingSlash( value: string ): string {
	return value.startsWith( '/' ) ? value.slice( 1 ) : value;
}
