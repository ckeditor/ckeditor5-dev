/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import matter from 'gray-matter';
import { AsyncArray } from './asyncarray.js';
import type { ChangesetPathsWithGithubUrl, FileMetadata, ParsedFile } from '../types.js';
import { sortEntriesByScopeAndDate } from './sortentriesbyscopeanddate.js';
import { isValid, parse } from 'date-fns';
import { normalizeEntry } from './normalizeentry.js';

type SimpleParsedFile = Pick<ParsedFile, 'changesetPath' | 'gitHubUrl' | 'shouldSkipLinks'>;

/**
 * Reads and processes input files to extract changelog entries.
 */
export function parseChangelogEntries(
	entryPaths: Array<ChangesetPathsWithGithubUrl>,
	isSinglePackage: boolean
): Promise<Array<ParsedFile>> {
	const fileEntries = entryPaths.reduce<Array<SimpleParsedFile>>( ( acc, { filePaths, gitHubUrl, shouldSkipLinks } ) => {
		for ( const changesetPath of filePaths ) {
			acc.push( { changesetPath, gitHubUrl, shouldSkipLinks } );
		}
		return acc;
	}, [] );

	return AsyncArray
		.from( Promise.resolve( fileEntries ) )
		.map( async ( { changesetPath, gitHubUrl, shouldSkipLinks } ) => ( {
			...( matter( await fs.readFile( changesetPath, 'utf-8' ) ) as unknown as { content: string; data: FileMetadata } ),
			gitHubUrl,
			changesetPath,
			shouldSkipLinks,
			createdAt: extractDateFromFilename( changesetPath )
		} ) )
		.map( entry => normalizeEntry( entry, isSinglePackage ) )
		.then( entries => sortEntriesByScopeAndDate( entries ) );
}

/**
 * Extracts date from changeset filename.
 * Expects format: YYYYMMDDHHMMSS_description.md
 */
function extractDateFromFilename( changesetPath: string ): Date {
	const filename = changesetPath.split( '/' ).pop() || '';
	const dateMatch = filename.match( /^(\d{14})_/ );

	if ( !dateMatch || !dateMatch[ 1 ] ) {
		// Fallback to current date if no date pattern found
		return new Date();
	}

	const dateStr = dateMatch[ 1 ];
	const parsedDate = parse( dateStr, 'yyyyMMddHHmmss', new Date() );

	// Validate the parsed date
	if ( !isValid( parsedDate ) ) {
		// Fallback to current date if parsing failed
		return new Date();
	}

	return parsedDate;
}
