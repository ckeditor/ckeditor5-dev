/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { InternalError } from './internalerror.js';
import type { Section, SectionsWithEntries } from '../types.js';

/**
 * This function determines which sections contain valid entries to be shown.
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
