/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { CHANGELOG_HEADER } from './constants.js';
import saveChangelog from './savechangelog.js';
import getChangelog from './getchangelog.js';

/**
 * @param {number} length
 * @param {string} [cwd=process.cwd()] Where to look for the changelog file.
 */
export default function truncateChangelog( length, cwd = process.cwd() ) {
	const changelog = getChangelog( cwd );

	if ( !changelog ) {
		return;
	}

	const entryHeader = '## [\\s\\S]+?';
	const entryHeaderRegexp = new RegExp( `\\n(${ entryHeader })(?=\\n${ entryHeader }|$)`, 'g' );

	const entries = [ ...changelog.matchAll( entryHeaderRegexp ) ]
		.filter( match => match && match[ 1 ] )
		.map( match => match[ 1 ] );

	if ( !entries.length ) {
		return;
	}

	const truncatedEntries = entries.slice( 0, length );

	const changelogFooter = entries.length > truncatedEntries.length ?
		`\n\n---\n\nTo see all releases, visit the [release page](${ workspaces.getRepositoryUrl( cwd ) }/releases).\n` :
		'\n';

	const truncatedChangelog = CHANGELOG_HEADER + truncatedEntries.join( '\n' ).trim() + changelogFooter;

	saveChangelog( truncatedChangelog, cwd );
}
