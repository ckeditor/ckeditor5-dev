/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, Section, SectionsWithEntries } from '../types.js';
import chalk from 'chalk';
import { logInfo } from './loginfo.js';

/**
 * A class responsible for logging changelog files in a structured format.
 */
class ChangelogLogger {
	private readonly baseIndent = 2;
	private readonly entryIndent = 4;
	private readonly contentIndent = 6;

	constructor(private readonly sections: SectionsWithEntries) {}

	/**
	 * Logs all changelog sections and their entries.
	 *
	 * @throws {Error} If there's an error during logging
	 */
	log(): void {
		try {
			this.logStart();
			this.logSections();
		} catch (error) {
			throw new Error(
				`Failed to log changelog files: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Logs the start message.
	 */
	private logStart(): void {
		logInfo(`📍 ${chalk.cyan('Listing the changes...')}\n`);
	}

	/**
	 * Logs all sections that have entries.
	 */
	private logSections(): void {
		for (const [sectionName, section] of Object.entries(this.sections)) {
			if (!section.entries?.length) {
				continue;
			}

			this.logSection(sectionName, section);
			logInfo('');
		}
	}

	/**
	 * Logs a single section and its entries.
	 *
	 * @param sectionName - Name of the section
	 * @param section - Section content
	 */
	private logSection(sectionName: string, section: Section): void {
		const color = this.getSectionColor(sectionName);
		this.logSectionTitle(section.title, color);
		this.logSectionEntries(section.entries);
	}

	/**
	 * Gets the appropriate color for a section.
	 *
	 * @param sectionName - Name of the section
	 * @returns Chalk color function
	 */
	private getSectionColor(sectionName: string): typeof chalk.red | typeof chalk.blue {
		return sectionName === 'invalid' ? chalk.red : chalk.blue;
	}

	/**
	 * Logs the section title.
	 *
	 * @param title - Title of the section
	 * @param color - Color to use for the title
	 */
	private logSectionTitle(title: string, color: typeof chalk.red | typeof chalk.blue): void {
		logInfo(color(`🔸 Found ${title}:`), { indent: this.baseIndent });
	}

	/**
	 * Logs all entries in a section.
	 *
	 * @param entries - Array of entries to log
	 */
	private logSectionEntries(entries: Array<Entry>): void {
		for (const entry of entries) {
			this.logEntry(entry);
		}
	}

	/**
	 * Logs a single entry and its content.
	 *
	 * @param entry - Entry to log
	 */
	private logEntry(entry: Entry): void {
		this.logMainContent(entry.data.mainContent);
		this.logRestContent(entry.data.restContent);
	}

	/**
	 * Logs the main content of an entry.
	 *
	 * @param content - Main content to log
	 */
	private logMainContent(content: string): void {
		logInfo(`* "${content}"`, { indent: this.entryIndent });
	}

	/**
	 * Logs the rest of the entry content.
	 *
	 * @param content - Additional content to log
	 */
	private logRestContent(content: Array<string>): void {
		if (content.length) {
			content.forEach(text => {
				logInfo(chalk.italic(`"${text}"`), { indent: this.contentIndent });
			});
		}
	}
}

/**
 * Logs changelog files in a structured format.
 * Displays sections and their entries with proper formatting and colors.
 * Invalid entries are displayed in red, while valid entries are displayed in blue.
 *
 * @param sections - Object containing sections with their entries
 * @throws {Error} If there's an error during logging
 *
 * @example
 * ```typescript
 * const sections = {
 *   major: {
 *     title: "Major changes",
 *     entries: [{ data: { mainContent: "Breaking change", restContent: ["Details"] } }]
 *   },
 *   invalid: {
 *     title: "Invalid entries",
 *     entries: [{ data: { mainContent: "Invalid entry", restContent: [] } }]
 *   }
 * };
 *
 * logChangelogFiles(sections);
 * ```
 */
export function logChangelogFiles(sections: SectionsWithEntries): void {
	const logger = new ChangelogLogger(sections);
	logger.log();
}
