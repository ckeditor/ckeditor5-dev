/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { simpleGit } from 'simple-git';

const CHUNK_LENGTH_LIMIT = 4000;

export default async function commit(
	{ cwd, message, files, dryRun = false }: { cwd: string; message: string; files: Array<string>; dryRun?: boolean }
): Promise<void> {
	if ( !files.length ) {
		return;
	}

	const git = simpleGit( { baseDir: cwd } );

	const makeCommit = async () => {
		for ( const chunk of splitPathsIntoChunks( files ) ) {
			await git.add( chunk );
		}

		return git.commit( message );
	};

	if ( dryRun ) {
		const lastCommit = await git.log( [ '-1' ] );

		await makeCommit();
		await git.reset( [ lastCommit.latest!.hash ] );
	} else {
		await makeCommit();
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
