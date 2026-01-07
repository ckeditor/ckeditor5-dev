/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { simpleGit, type SimpleGit } from 'simple-git';
import upath from 'upath';
import fs from 'node:fs/promises';

const CHUNK_LENGTH_LIMIT = 4000;

export default async function commit(
	{ cwd, message, files, dryRun = false }: { cwd: string; message: string; files: Array<string>; dryRun?: boolean }
): Promise<void> {
	cwd = upath.normalize( cwd );

	const git = simpleGit( { baseDir: cwd } );
	const filteredFiles = await getFilesToCommit( cwd, files, git );

	// To avoid an error when trying to commit a non-existing path.
	if ( !filteredFiles.length ) {
		return;
	}

	if ( dryRun ) {
		const lastCommit = await git.log( [ '-1' ] );

		await makeCommit( git, message, filteredFiles );
		await git.reset( [ lastCommit.latest!.hash ] );
	} else {
		await makeCommit( git, message, filteredFiles );
	}
}

async function makeCommit( git: SimpleGit, message: string, filteredFiles: Array<string> ): Promise<void> {
	for ( const chunk of splitPathsIntoChunks( filteredFiles ) ) {
		await git.add( chunk );
	}

	const status = await git.status();

	if ( !status.isClean() ) {
		await git.commit( message );
	}
}

function splitPathsIntoChunks( filePaths: Array<string> ): Array<Array<string>> {
	return filePaths.reduce( ( chunks, singlePath: string ) => {
		const lastChunk = chunks.at( -1 )!;
		const newLength = [ ...lastChunk, singlePath ].join( ' ' ).length;

		if ( newLength < CHUNK_LENGTH_LIMIT ) {
			lastChunk.push( singlePath );
		} else {
			chunks.push( [ singlePath ] );
		}

		return chunks;
	}, [ [] ] as Array<Array<string>> );
}

/**
 * Returns a set of Git-tracked file paths by parsing `git ls-files --stage`.
 * Supports file names with spaces using tab-splitting.
 */
async function getFilesToCommit( cwd: string, files: Array<string>, git: SimpleGit ): Promise<Array<string>> {
	const gitTracked = await getTrackedFiles( git );

	const filePromises = files
		.map( filePath => {
			const normalized = upath.normalize( filePath );
			// `upath` and Unix environment may fail on detecting a Windows-like path.
			// Hence, let's use `isAbsolute` from both systems.
			const isAbsolute = upath.win32.isAbsolute( normalized ) || upath.posix.isAbsolute( normalized );

			return isAbsolute ? upath.relative( cwd, normalized ) : normalized;
		} )
		.map( async itemPath => {
			if ( gitTracked.has( itemPath ) ) {
				return itemPath;
			}

			const fullPath = upath.join( cwd, itemPath );

			try {
				await fs.access( fullPath );

				return itemPath;
			} catch {
				return null;
			}
		} );

	return ( await Promise.all( filePromises ) )
		.filter( ( pathOrNull ): pathOrNull is string => pathOrNull !== null );
}

/**
 * Returns a set of Git-tracked files in a current repository.
 */
async function getTrackedFiles( git: SimpleGit ): Promise<Set<string>> {
	const gitTrackedOutput = await git.raw( [ 'ls-files', '--stage' ] );
	const gitTracked = gitTrackedOutput
		.split( '\n' )
		// <mode> <object> <stage>\t<file>
		// Split by tab and take the last part, which is the file path that could contain spaces.
		.map( line => line.trim().split( '\t' ).pop() )
		.filter( Boolean )
		.map( p => upath.normalize( p! ) );

	return new Set( gitTracked );
}
