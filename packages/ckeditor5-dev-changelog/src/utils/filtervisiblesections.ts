/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
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
		const message =
			'No valid entries were found. Please ensure that:\n' +
			'1) Input files exist in the `.changelog/` directory.\n' +
			'2) The `cwd` parameter points to the root of your project.\n' +
			'3) The `packagesDirectory` parameter correctly specifies the packages folder.\n' +
			'If no errors appear in the console but inputs are present, your project configuration may be incorrect.\n' +
			'If validation errors are shown, please resolve them according to the details provided.\n';

		throw new InternalError( message );
	}

	return sectionsToDisplay;
}
