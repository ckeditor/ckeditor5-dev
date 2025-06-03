/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import matter from 'gray-matter';
import { AsyncArray } from './asyncarray.js';
import type { ChangesetPathsWithGithubUrl, ParsedFile } from '../types.js';

type Foo = Pick<ParsedFile, 'changesetPath' | 'gitHubUrl' | 'skipLinks'>;

/**
 * This function reads and processes the changeset files to extract changelog information.
 */
export function getInputParsed( inputPaths: Array<ChangesetPathsWithGithubUrl> ): Promise<Array<ParsedFile>> {
	const fileEntries = inputPaths.reduce<Array<Foo>>( ( acc, { changesetPaths, gitHubUrl, skipLinks } ) => {
		for ( const changesetPath of changesetPaths ) {
			acc.push( { changesetPath, gitHubUrl, skipLinks } );
		}
		return acc;
	}, [] );

	return AsyncArray
		.from( Promise.resolve( fileEntries ) )
		.map( async ( { changesetPath, gitHubUrl, skipLinks } ) => ( {
			...matter( await fs.readFile( changesetPath, 'utf-8' ) ),
			gitHubUrl,
			changesetPath,
			skipLinks
		} ) )
		.then( value => value );
}
