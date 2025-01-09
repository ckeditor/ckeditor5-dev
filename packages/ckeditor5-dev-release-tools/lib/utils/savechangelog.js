/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { CHANGELOG_FILE } from './constants.js';

/**
 * @param {string} content
 * @param {string} [cwd=process.cwd()] Where to look for the changelog file.
 */
export default function saveChangelog( content, cwd = process.cwd() ) {
	const changelogFile = path.join( cwd, CHANGELOG_FILE );

	fs.writeFileSync( changelogFile, content, 'utf-8' );
}
