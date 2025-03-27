/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Section, SectionsWithEntries } from '../types.js';

/**
 * Filters and returns sections that should be displayed in the changelog.
 * This function determines which sections contain valid entries to be shown.
 */
export function getSectionsToDisplay( sectionsWithEntries: SectionsWithEntries ): Array<Section> {
	return Object.entries( sectionsWithEntries )
		.filter( ( [ sectionName, { entries } ] ) => entries?.length && sectionName !== 'invalid' )
		.map( ( [ , section ] ) => section );
}
