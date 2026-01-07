/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { CHANGELOG_HEADER } from './constants.js';
import getChangelog from './getchangelog.js';

/**
 * Retrieves changes from the changelog for the given version (tag).
 *
 * @param {string} version
 * @param {string} [cwd=process.cwd()] Where to look for the changelog file.
 * @returns {string|null}
 */
export default function getChangesForVersion( version, cwd = process.cwd() ) {
	version = version.replace( /^v/, '' );

	const changelog = getChangelog( cwd ).replace( CHANGELOG_HEADER, '\n' );

	const match = changelog.match( new RegExp( `\\n(## \\[?${ version }\\]?[\\s\\S]+?)(?:\\n## \\[?|$)` ) );

	if ( !match || !match[ 1 ] ) {
		return null;
	}

	return match[ 1 ].replace( /##[^\n]+\n/, '' ).trim();
}
