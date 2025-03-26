/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Section, SectionsWithEntries } from '../types.js';

/**
 * A class responsible for filtering and preparing sections for display.
 */
class SectionDisplayFilter {
	constructor(private readonly sections: SectionsWithEntries) {}

	/**
	 * Filters and returns sections that should be displayed.
	 * A section is displayed if it has entries and is not marked as invalid.
	 *
	 * @returns Array of sections to display
	 * @throws {Error} If the sections object is invalid
	 */
	filter(): Array<Section> {
		try {
			return this.filterValidSections();
		} catch (error) {
			throw new Error(
				`Failed to filter sections for display: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Filters out invalid sections and sections without entries.
	 *
	 * @returns Array of valid sections
	 */
	private filterValidSections(): Array<Section> {
		return Object.entries(this.sections)
			.filter(this.isValidSection)
			.map(([, section]) => section);
	}

	/**
	 * Checks if a section is valid for display.
	 * A section is valid if it has entries and is not marked as invalid.
	 *
	 * @param entry - Section entry from Object.entries
	 * @returns Whether the section should be displayed
	 */
	private isValidSection([sectionName, { entries }]: [string, Section]): boolean {
		return Boolean(entries?.length) && sectionName !== 'invalid';
	}
}

/**
 * Filters and returns sections that should be displayed.
 * A section is displayed if it has entries and is not marked as invalid.
 *
 * @param sectionsWithEntries - Object containing sections with their entries
 * @returns Array of sections to display
 * @throws {Error} If the sections object is invalid
 *
 * @example
 * ```typescript
 * const sections = {
 *   major: { entries: [{ message: "Breaking change" }] },
 *   minor: { entries: [] },
 *   invalid: { entries: [{ message: "Invalid entry" }] }
 * };
 *
 * const displaySections = getSectionsToDisplay(sections);
 * // Returns: [{ entries: [{ message: "Breaking change" }] }]
 * ```
 */
export function getSectionsToDisplay(sectionsWithEntries: SectionsWithEntries): Array<Section> {
	const filter = new SectionDisplayFilter(sectionsWithEntries);
	return filter.filter();
}
