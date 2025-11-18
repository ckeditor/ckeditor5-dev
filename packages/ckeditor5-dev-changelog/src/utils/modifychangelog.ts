/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import { styleText } from 'util';
import upath from 'upath';
import { logInfo } from './loginfo.js';
import { truncateChangelog } from './truncatechangelog.js';
import { CHANGELOG_FILE, CHANGELOG_HEADER } from './constants.js';

/**
 * This function writes the generated changelog content to the repository's changelog file.
 *
 * It reads the existing changelog (if any), inserts the new changelog content after the defined header,
 * writes the updated content back to the changelog file, and truncates the changelog to keep a manageable length.
 */
export async function modifyChangelog( newChangelog: string, cwd: string ): Promise<void> {
	const changelogPath = upath.join( cwd, CHANGELOG_FILE );
	const existingChangelog = await readExistingChangelog( changelogPath );

	const updatedChangelog = prepareChangelogContent( existingChangelog, newChangelog );

	logInfo( `○ ${ styleText( 'cyan', 'Appending changes to the existing changelog...' ) }` );

	await fs.writeFile( changelogPath, updatedChangelog, 'utf-8' );
	await truncateChangelog( 5, cwd );
}

/**
 * Reads the existing changelog file or returns an empty string if the file doesn't exist.
 */
async function readExistingChangelog( changelogPath: string ): Promise<string> {
	try {
		return await fs.readFile( changelogPath, 'utf-8' );
	} catch {
		logInfo( `○ ${ styleText( 'yellow', 'CHANGELOG.md not found.' ) }` );

		return '';
	}
}

/**
 * Prepares the new changelog content by inserting it after the header or at the beginning if header is missing.
 */
function prepareChangelogContent( existingChangelog: string, newChangelog: string ): string {
	const headerIndex = existingChangelog.indexOf( CHANGELOG_HEADER );

	if ( headerIndex === -1 ) {
		return `${ CHANGELOG_HEADER }\n\n${ newChangelog }${ existingChangelog }`;
	}

	const insertPosition = headerIndex + CHANGELOG_HEADER.length;
	return existingChangelog.slice( 0, insertPosition ) + '\n\n' + newChangelog + existingChangelog.slice( insertPosition );
}
