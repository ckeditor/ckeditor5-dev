/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import upath from 'upath';

const createdDirectories: Array<string> = [];

/**
 * Creates an empty temporary directory. The path is not resolved, so on macOS it contains a symbolic link
 * (`/var` → `/private/var`).
 */
export async function createTempDirectory(): Promise<string> {
	const path = upath.normalize( await mkdtemp( upath.join( tmpdir(), 'ckeditor5-dev-agents-' ) ) );

	createdDirectories.push( path );

	return path;
}

export async function removeTempDirectories(): Promise<void> {
	await Promise.all( createdDirectories.splice( 0 ).map( path => rm( path, { recursive: true, force: true } ) ) );
}

/**
 * Writes files relative to the root, creating directories on the way.
 */
export async function writeFiles( root: string, files: Record<string, string> ): Promise<void> {
	for ( const [ path, content ] of Object.entries( files ) ) {
		const absolutePath = upath.join( root, path );

		await mkdir( upath.dirname( absolutePath ), { recursive: true } );
		await writeFile( absolutePath, content );
	}
}

export async function readText( path: string ): Promise<string> {
	return readFile( path, 'utf8' );
}

export async function readJson<T = unknown>( path: string ): Promise<T> {
	return JSON.parse( await readFile( path, 'utf8' ) ) as T;
}
