/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { CHANGELOG_FILE } from './constants.js';

/**
 * @param {String} content
 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
 */
export default function saveChangelog( content, cwd = process.cwd() ) {
	const changelogFile = path.join( cwd, CHANGELOG_FILE );

	fs.writeFileSync( changelogFile, content, 'utf-8' );
}
