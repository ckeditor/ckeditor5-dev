/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs/promises';
import { logInfo } from './loginfo.js';
import chalk from 'chalk';
import { truncateChangelog } from './truncatechangelog.js';
import { CHANGELOG_FILE, CHANGELOG_HEADER } from '../constants.js';

/**
 * Options for modifying the changelog.
 */
interface ChangelogModifierOptions {
	/**
	 * The new changelog content to insert.
	 */
	newChangelog: string;

	/**
	 * The current working directory.
	 */
	cwd: string;

	/**
	 * The maximum number of entries to keep in the changelog.
	 * @default 5
	 */
	maxEntries?: number;
}

/**
 * A class responsible for modifying the changelog file.
 */
class ChangelogModifier {
	private readonly options: ChangelogModifierOptions;
	private readonly changelogPath: string;

	/**
	 * Creates a new instance of the ChangelogModifier.
	 *
	 * @param options - The options for modifying the changelog.
	 */
	constructor(options: ChangelogModifierOptions) {
		this.options = {
			maxEntries: 5,
			...options
		};
		this.changelogPath = upath.join(this.options.cwd, CHANGELOG_FILE);
	}

	/**
	 * Modifies the changelog file by inserting new content while preserving the existing structure.
	 * If the file doesn't exist, it creates a new one with the proper header.
	 * After modification, it truncates the changelog to keep only the most recent entries.
	 *
	 * @throws {Error} If there's an error reading or writing the changelog file.
	 */
	async modify(): Promise<void> {
		try {
			const existingChangelog = await this.readExistingChangelog();
			const updatedChangelog = this.prepareChangelogContent(existingChangelog);
			
			logInfo(`📍 ${chalk.cyan('Appending changes to the existing changelog...\n')}`);
			
			await this.saveChangelog(updatedChangelog);
			await this.truncateChangelog();
		} catch (error) {
			throw new Error(`Failed to modify changelog: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Reads the existing changelog file or returns an empty string if the file doesn't exist.
	 *
	 * @returns The existing changelog content or an empty string if the file doesn't exist.
	 * @throws {Error} If there's an error reading the changelog file.
	 */
	private async readExistingChangelog(): Promise<string> {
		try {
			return await fs.readFile(this.changelogPath, 'utf-8');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				logInfo(`📍 ${chalk.yellow('CHANGELOG.md not found. Creating a new one.')}\n`);
				return '';
			}
			throw new Error(`Failed to read changelog file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Prepares the new changelog content by inserting it after the header or at the beginning if header is missing.
	 *
	 * @param existingChangelog - The existing changelog content.
	 * @returns The prepared changelog content.
	 */
	private prepareChangelogContent(existingChangelog: string): string {
		const headerIndex = existingChangelog.indexOf(CHANGELOG_HEADER);

		if (headerIndex === -1) {
			return `${CHANGELOG_HEADER}\n\n${this.options.newChangelog}${existingChangelog}`;
		}

		const insertPosition = headerIndex + CHANGELOG_HEADER.length;
		return existingChangelog.slice(0, insertPosition) + '\n\n' + this.options.newChangelog + existingChangelog.slice(insertPosition);
	}

	/**
	 * Saves the changelog content to the file.
	 *
	 * @param content - The changelog content to save.
	 * @throws {Error} If there's an error writing the changelog file.
	 */
	private async saveChangelog(content: string): Promise<void> {
		try {
			await fs.writeFile(this.changelogPath, content, 'utf-8');
		} catch (error) {
			throw new Error(`Failed to write changelog file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Truncates the changelog to keep only the most recent entries.
	 *
	 * @throws {Error} If there's an error truncating the changelog.
	 */
	private async truncateChangelog(): Promise<void> {
		try {
			await truncateChangelog(this.options.maxEntries!, this.options.cwd);
		} catch (error) {
			throw new Error(`Failed to truncate changelog: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}

/**
 * Modifies the changelog file by inserting new content while preserving the existing structure.
 * If the file doesn't exist, it creates a new one with the proper header.
 * After modification, it truncates the changelog to keep only the most recent entries.
 *
 * @param newChangelog - The new changelog content to insert.
 * @param cwd - The current working directory.
 * @param maxEntries - The maximum number of entries to keep in the changelog (default: 5).
 * @throws {Error} If there's an error modifying the changelog.
 *
 * @example
 * ```typescript
 * // Basic usage
 * await modifyChangelog('New changes...', process.cwd());
 *
 * // With custom max entries
 * await modifyChangelog('New changes...', process.cwd(), 10);
 * ```
 */
export async function modifyChangelog(newChangelog: string, cwd: string, maxEntries?: number): Promise<void> {
	const modifier = new ChangelogModifier({ newChangelog, cwd, maxEntries });
	await modifier.modify();
}

