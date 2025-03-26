/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import upath from 'upath';
import { CHANGELOG_FILE, CHANGELOG_HEADER } from '../constants.js';
import { getRepositoryUrl } from './getrepositoryurl.js';

interface ChangelogTruncatorOptions {
	length: number;
	cwd?: string;
}

class ChangelogTruncator {
	private readonly entryHeaderPattern = '## [\\s\\S]+?';
	private readonly entryHeaderRegexp: RegExp;

	constructor(private readonly options: ChangelogTruncatorOptions) {
		this.entryHeaderRegexp = new RegExp(`\\n(${this.entryHeaderPattern})(?=\\n${this.entryHeaderPattern}|$)`, 'g');
	}

	/**
	 * Truncates the changelog to the specified number of entries.
	 * 
	 * @throws {Error} If changelog file cannot be read or written
	 */
	async truncate(): Promise<void> {
		try {
			const changelog = this.getChangelog();
			if (!changelog) {
				return;
			}

			const entries = this.extractEntries(changelog);
			if (!entries.length) {
				return;
			}

			const truncatedChangelog = await this.createTruncatedChangelog(entries);
			this.saveChangelog(truncatedChangelog);
		} catch (error) {
			throw new Error(
				`Failed to truncate changelog: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Reads the changelog file.
	 * 
	 * @returns The changelog content or null if file doesn't exist
	 * @throws {Error} If file cannot be read
	 */
	private getChangelog(): string | null {
		const changelogFile = upath.join(this.options.cwd || process.cwd(), CHANGELOG_FILE);

		try {
			if (!fs.existsSync(changelogFile)) {
				return null;
			}
			return fs.readFileSync(changelogFile, 'utf-8');
		} catch (error) {
			throw new Error(
				`Failed to read changelog file: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Extracts entries from the changelog content.
	 * 
	 * @param changelog - The changelog content
	 * @returns Array of changelog entries
	 */
	private extractEntries(changelog: string): Array<string> {
		return [...changelog.matchAll(this.entryHeaderRegexp)]
			.filter(match => match && match[1])
			.map(match => match[1]!);
	}

	/**
	 * Creates the truncated changelog content.
	 * 
	 * @param entries - Array of changelog entries
	 * @returns The truncated changelog content
	 */
	private async createTruncatedChangelog(entries: Array<string>): Promise<string> {
		const truncatedEntries = entries.slice(0, this.options.length);
		const repositoryUrl = await getRepositoryUrl(this.options.cwd || process.cwd());
		const changelogFooter = entries.length > truncatedEntries.length ?
			`\n\n---\n\nTo see all releases, visit the [release page](${repositoryUrl}/releases).\n` :
			'\n';

		return CHANGELOG_HEADER + '\n\n' + truncatedEntries.join('\n').trim() + changelogFooter;
	}

	/**
	 * Saves the changelog content to file.
	 * 
	 * @param content - The changelog content to save
	 * @throws {Error} If file cannot be written
	 */
	private saveChangelog(content: string): void {
		const changelogFile = upath.join(this.options.cwd || process.cwd(), CHANGELOG_FILE);

		try {
			fs.writeFileSync(changelogFile, content, 'utf-8');
		} catch (error) {
			throw new Error(
				`Failed to write changelog file: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

/**
 * Truncates the changelog to the specified number of entries.
 * If the changelog has more entries than the specified length,
 * it adds a footer with a link to the full release page.
 * 
 * @param length - Number of entries to keep in the changelog
 * @param cwd - Directory containing the changelog file (defaults to process.cwd())
 * @throws {Error} If changelog file cannot be read or written
 * 
 * @example
 * // Truncate changelog to 5 entries
 * await truncateChangelog(5);
 * 
 * // Truncate changelog in specific directory
 * await truncateChangelog(5, "./packages/my-package");
 */
export async function truncateChangelog(length: number, cwd = process.cwd()): Promise<void> {
	const truncator = new ChangelogTruncator({ length, cwd });
	await truncator.truncate();
}

