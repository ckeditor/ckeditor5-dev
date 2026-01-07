/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { isValid, parse } from 'date-fns';
import { AsyncArray } from './asyncarray.js';
import { sortEntriesByScopeAndDate } from './sortentriesbyscopeanddate.js';
import { normalizeEntry } from './normalizeentry.js';
import type { ChangesetPathsWithGithubUrl, FileMetadata, ParsedFile } from '../types.js';

type SimpleParsedFile = Pick<ParsedFile, 'changesetPath' | 'gitHubUrl' | 'linkFilter'>;

/**
 * Reads and processes input files to extract changelog entries.
 */
export function parseChangelogEntries(
	entryPaths: Array<ChangesetPathsWithGithubUrl>,
	isSinglePackage: boolean
): Promise<Array<ParsedFile>> {
	const fileEntries = entryPaths.reduce<Array<SimpleParsedFile>>( ( acc, { filePaths, gitHubUrl, linkFilter } ) => {
		for ( const changesetPath of filePaths ) {
			acc.push( { changesetPath, gitHubUrl, linkFilter } );
		}
		return acc;
	}, [] );

	return AsyncArray
		.from( Promise.resolve( fileEntries ) )
		.map( async ( { changesetPath, gitHubUrl, linkFilter } ) => ( {
			...( matter( await fs.readFile( changesetPath, 'utf-8' ) ) as unknown as { content: string; data: FileMetadata } ),
			gitHubUrl,
			changesetPath,
			linkFilter,
			createdAt: extractDateFromFilename( changesetPath )
		} ) )
		.map( entry => normalizeEntry( entry, isSinglePackage ) )
		.then( entries => sortEntriesByScopeAndDate( entries ) );
}

/**
 * Extracts date from an entry filename (`YYYYMMDDHHMMSS_*.md`).
 *
 * Defaults to the current date if the filename does not match the expected format.
 */
function extractDateFromFilename( changesetPath: string ): Date {
	const now = new Date();
	const filename = changesetPath.split( '/' ).pop() || '';
	const dateMatch = filename.match( /^(\d{14})_/ );

	if ( !dateMatch || !dateMatch[ 1 ] ) {
		// Fallback to the current date if no date pattern found.
		return now;
	}

	const parsedDate = parse( dateMatch[ 1 ], 'yyyyMMddHHmmss', now );

	// Validate the parsed date and fallback to the current date when failed.
	if ( !isValid( parsedDate ) ) {
		return now;
	}

	return parsedDate;
}
