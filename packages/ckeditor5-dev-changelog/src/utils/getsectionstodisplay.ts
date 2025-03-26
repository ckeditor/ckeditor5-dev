/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Section, SectionsWithEntries } from '../types.js';

export function getSectionsToDisplay( sectionsWithEntries: SectionsWithEntries ): Section[] {
	return Object.entries( sectionsWithEntries )
		.filter( ( [ sectionName, { entries } ] ) => entries?.length && sectionName !== 'invalid' )
		.map( ( [ , section ] ) => section );
}
