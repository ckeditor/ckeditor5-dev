/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CHANGELOG_FILE } from './constants.js';

/**
 * @param {string} [cwd=process.cwd()] Where to look for the changelog file.
 * @returns {string|null}
 */
export default function getChangelog( cwd = process.cwd() ) {
	const changelogFile = path.join( cwd, CHANGELOG_FILE );

	if ( !fs.existsSync( changelogFile ) ) {
		return null;
	}

	return fs.readFileSync( changelogFile, 'utf-8' );
}
