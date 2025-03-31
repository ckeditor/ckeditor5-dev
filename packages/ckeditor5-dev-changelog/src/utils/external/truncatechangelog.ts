/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import upath from 'upath';
import { CHANGELOG_FILE, CHANGELOG_HEADER } from '../../constants.js';
import { getRepositoryUrl } from './getrepositoryurl.js';

/**
 * This function limits the size of the changelog by removing older entries.
 */
export async function truncateChangelog( length: number, cwd = process.cwd() ): Promise<void> {
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
	const repositoryUrl = await getRepositoryUrl( cwd );
	const changelogFooter = entries.length > truncatedEntries.length ?
		`\n\n---\n\nTo see all releases, visit the [release page](${ repositoryUrl }/releases).\n` :
		'\n';

	const truncatedChangelog = CHANGELOG_HEADER + '\n\n' + truncatedEntries.join( '\n' ).trim() + changelogFooter;

	saveChangelog( truncatedChangelog, cwd );
}

function getChangelog( cwd = process.cwd() ) {
	const changelogFile = upath.join( cwd, CHANGELOG_FILE );

	if ( !fs.existsSync( changelogFile ) ) {
		return null;
	}

	return fs.readFileSync( changelogFile, 'utf-8' );
}

function saveChangelog( content: string, cwd = process.cwd() ) {
	const changelogFile = upath.join( cwd, CHANGELOG_FILE );

	fs.writeFileSync( changelogFile, content, 'utf-8' );
}

