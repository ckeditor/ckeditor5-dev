/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs/promises';
import { logInfo } from './logInfo.js';
import chalk from 'chalk';
import { truncateChangelog } from '@ckeditor/ckeditor5-dev-release-tools';

// todo fix this function and handle it better
export async function modifyChangelog( newChangelog: string, cwd: string ): Promise<void> {
	const changelogPath = upath.join( cwd, 'CHANGELOG.md' );
	let existingChangelog = '';

	try {
		existingChangelog = await fs.readFile( changelogPath, 'utf-8' );
	} catch {
		console.warn( 'CHANGELOG.md not found. Creating a new one.' );
	}

	const header = 'Changelog\n=========';
	const insertIndex = existingChangelog.indexOf( header );
	let changelog = '';

	if ( insertIndex !== -1 ) {
		// Find where to insert: after the header line
		const insertPosition = insertIndex + header.length; // +2 for newline characters
		changelog = existingChangelog.slice( 0, insertPosition ) + '\n\n' + newChangelog + existingChangelog.slice( insertPosition );
	} else {
		// If the header is missing, prepend everything
		changelog = `${ header }\n\n${ newChangelog }${ existingChangelog }`;
	}

	logInfo( `📍 ${ chalk.cyan( 'Appending changes to the existing changelog...' ) }\n` );

	await fs.writeFile( changelogPath, changelog, 'utf-8' );

	truncateChangelog( 5, cwd );
}
