/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { InternalError } from './internalerror.js';
import type { Section, SectionsWithEntries } from '../types.js';

/**
 * Filters and returns only those changelog sections that:
 * * Have at least one entry.
 * * Are not explicitly marked to be excluded from the final changelog.
 *
 * This is used to determine which sections should be displayed or processed for changelog generation.
 */
export function filterVisibleSections( sectionsWithEntries: SectionsWithEntries ): Array<Section> {
	const sectionsToDisplay = Object.entries( sectionsWithEntries )
		.filter( ( [ , { entries, excludeInChangelog } ] ) => {
			return entries?.length && !excludeInChangelog;
		} )
		.map( ( [ , section ] ) => section );

	if ( !sectionsToDisplay.length ) {
		throw new InternalError();
	}

	return sectionsToDisplay;
}
