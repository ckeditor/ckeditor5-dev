/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import upath from 'upath';
import { CHANGELOG_FILE, CHANGELOG_HEADER } from '../constants.js';
import { getRepositoryUrl } from './getrepositoryurl.js';

/**
 * Truncates the changelog to keep only the most recent entries.
 *
 * @param length - Number of entries to keep
 * @param cwd - Current working directory (default: process.cwd())
 * @throws {Error} If there's an error reading or writing the changelog file
 */
export async function truncateChangelog( length: number, cwd = process.cwd() ): Promise<void> {
	const changelog = await readChangelogFile( cwd );

	if ( !changelog ) {
		return;
	}

	const entries = extractChangelogEntries( changelog );

	if ( !entries.length ) {
		return;
	}

	const truncatedEntries = entries.slice( 0, length );
	const repositoryUrl = await getRepositoryUrl( cwd );
	const changelogFooter = generateChangelogFooter( entries.length, truncatedEntries.length, repositoryUrl );

	const truncatedChangelog = generateTruncatedChangelog( truncatedEntries, changelogFooter );
	await saveChangelogFile( truncatedChangelog, cwd );
}

/**
 * Reads the changelog file from the specified directory.
 *
 * @param cwd - Current working directory
 * @returns The contents of the changelog file or null if it doesn't exist
 */
async function readChangelogFile( cwd: string ): Promise<string | null> {
	const changelogFile = upath.join( cwd, CHANGELOG_FILE );

	if ( !fs.existsSync( changelogFile ) ) {
		return null;
	}

	return fs.readFileSync( changelogFile, 'utf-8' );
}

/**
 * Extracts changelog entries from the changelog content.
 *
 * @param changelog - The changelog content
 * @returns Array of changelog entries
 */
function extractChangelogEntries( changelog: string ): Array<string> {
	const entryHeader = '## [\\s\\S]+?';
	const entryHeaderRegexp = new RegExp( `\\n(${ entryHeader })(?=\\n${ entryHeader }|$)`, 'g' );

	return [ ...changelog.matchAll( entryHeaderRegexp ) ]
		.filter( match => match && match[ 1 ] )
		.map( match => match[ 1 ]! );
}

/**
 * Generates the footer for the truncated changelog.
 *
 * @param totalEntries - Total number of entries
 * @param truncatedEntries - Number of entries after truncation
 * @param repositoryUrl - URL of the repository
 * @returns The footer content or empty string if no truncation occurred
 */
function generateChangelogFooter( totalEntries: number, truncatedEntries: number, repositoryUrl: string ): string {
	return totalEntries > truncatedEntries ?
		`\n\n---\n\nTo see all releases, visit the [release page](${ repositoryUrl }/releases).\n` :
		'\n';
}

/**
 * Generates the complete truncated changelog content.
 *
 * @param entries - Array of changelog entries
 * @param footer - Footer content
 * @returns The complete truncated changelog content
 */
function generateTruncatedChangelog( entries: Array<string>, footer: string ): string {
	return CHANGELOG_HEADER + '\n\n' + entries.join( '\n' ).trim() + footer;
}

/**
 * Saves the changelog content to the file.
 *
 * @param content - The changelog content to save
 * @param cwd - Current working directory
 * @throws {Error} If there's an error writing the file
 */
async function saveChangelogFile( content: string, cwd: string ): Promise<void> {
	const changelogFile = upath.join( cwd, CHANGELOG_FILE );
	fs.writeFileSync( changelogFile, content, 'utf-8' );
}

