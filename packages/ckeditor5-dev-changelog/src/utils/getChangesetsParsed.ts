/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import type { ParsedFile } from '../types.js';

export async function getChangesetsParsed( changesetFilePaths: Array<string> ): Promise<Array<ParsedFile>> {
	const changesetFiles = await Promise.all( changesetFilePaths.map( file => fs.readFile( file, 'utf-8' ) ) );

	return changesetFiles.map( file => matter( file ) ) as unknown as Array<ParsedFile>;
}
