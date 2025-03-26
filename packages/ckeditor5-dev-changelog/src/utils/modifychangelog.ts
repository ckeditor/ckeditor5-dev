/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs/promises';
import { logInfo } from './loginfo.js';
import chalk from 'chalk';
import { truncateChangelog } from './truncatechangelog.js';
import { CHANGELOG_FILE, CHANGELOG_HEADER } from '../constants';

/**
 * Modifies the changelog file by inserting new content while preserving the existing structure.
 * If the file doesn't exist, it creates a new one with the proper header.
 * After modification, it truncates the changelog to keep only the most recent entries.
 */
export async function modifyChangelog(newChangelog: string, cwd: string): Promise<void> {
	const changelogPath = upath.join(cwd, CHANGELOG_FILE);
	const existingChangelog = await readExistingChangelog(changelogPath);

	const updatedChangelog = prepareChangelogContent(existingChangelog, newChangelog);

	logInfo(`📍 ${chalk.cyan('Appending changes to the existing changelog...\n')}`);

	await fs.writeFile(changelogPath, updatedChangelog, 'utf-8');
	await truncateChangelog(5, cwd);
}

/**
 * Reads the existing changelog file or returns an empty string if the file doesn't exist.
 */
async function readExistingChangelog(changelogPath: string): Promise<string> {
	try {
		return await fs.readFile(changelogPath, 'utf-8');
	} catch {
		logInfo(`📍 ${chalk.yellow('CHANGELOG.md not found. Creating a new one.')}\n`);
		
		return '';
	}
}

/**
 * Prepares the new changelog content by inserting it after the header or at the beginning if header is missing.
 */
function prepareChangelogContent(existingChangelog: string, newChangelog: string): string {
	const headerIndex = existingChangelog.indexOf(CHANGELOG_HEADER);

	if (headerIndex === -1) {
		return `${CHANGELOG_HEADER}\n\n${newChangelog}${existingChangelog}`;
	}

	const insertPosition = headerIndex + CHANGELOG_HEADER.length;
	return existingChangelog.slice(0, insertPosition) + '\n\n' + newChangelog + existingChangelog.slice(insertPosition);
}
