/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import matter from 'gray-matter';
import { AsyncArray } from './asyncarray.js';
import type { ChangesetPathsWithGithubUrl, ParsedFile } from '../types.js';

type SimpleParsedFile = Pick<ParsedFile, 'changesetPath' | 'gitHubUrl' | 'shouldSkipLinks'>;

/**
 * This function reads and processes the changeset files to extract changelog information.
 */
export function getInputParsed( inputPaths: Array<ChangesetPathsWithGithubUrl> ): Promise<Array<ParsedFile>> {
	const fileEntries = inputPaths.reduce<Array<SimpleParsedFile>>( ( acc, { changesetPaths, gitHubUrl, shouldSkipLinks } ) => {
		for ( const changesetPath of changesetPaths ) {
			acc.push( { changesetPath, gitHubUrl, shouldSkipLinks } );
		}
		return acc;
	}, [] );

	return AsyncArray
		.from( Promise.resolve( fileEntries ) )
		.map( async ( { changesetPath, gitHubUrl, shouldSkipLinks } ) => ( {
			...matter( await fs.readFile( changesetPath, 'utf-8' ) ),
			gitHubUrl,
			changesetPath,
			shouldSkipLinks
		} ) )
		.then( value => value );
}
