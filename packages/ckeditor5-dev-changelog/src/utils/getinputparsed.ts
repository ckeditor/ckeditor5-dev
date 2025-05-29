/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import matter from 'gray-matter';
import type { ChangesetPathsWithGithubUrl, ParsedFile } from '../types.js';

/**
 * This function reads and processes the changeset files to extract changelog information.
 */
export async function getInputParsed( inputPathsWithGithubUrl: Array<ChangesetPathsWithGithubUrl> ): Promise<Array<ParsedFile>> {
	return await Promise.all( inputPathsWithGithubUrl.flatMap( ( { changesetPaths, gitHubUrl, skipLinks } ) =>
		changesetPaths.map( async changesetPath => ( {
			...matter( await fs.readFile( changesetPath, 'utf-8' ) ),
			gitHubUrl,
			changesetPath,
			skipLinks
		} ) )
	) );
}
