/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Section, SectionsWithEntries } from '../types.js';

/**
 * This function determines which sections contain valid entries to be shown.
 */
export function getSectionsToDisplay( sectionsWithEntries: SectionsWithEntries ): Array<Section> {
	const sectionsToDisplay = Object.entries( sectionsWithEntries )
		.filter( ( [ sectionName, { entries } ] ) => entries?.length && sectionName !== 'invalid' )
		.map( ( [ , section ] ) => section );

	if ( !sectionsToDisplay.length ) {
		throw new Error(
			'No valid changesets found. Please verify that:\n' +
			'1) Changesets are properly created in the "changesetsDirectory"\n' +
			'2) The "cwd" parameter is set to the root of your project\n' +
			'3) The "packagesDirectory" parameter correctly specifies the directory containing packages.\n' +
			'If no errors are visible in the console, but changesets exist in your project, ' +
			'this likely indicates the project is not configured correctly.\n' +
			'If there are validation errors in the console, please fix them by following the validation details.\n'
		);
	}

	return sectionsToDisplay;
}
