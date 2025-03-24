/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, SectionsWithEntries } from '../types.js';

export function getSectionsToDisplay( sectionsWithEntries: SectionsWithEntries ): Array<[string, {
	entries: Array<Entry>;
	title: string;
}]> {
	return Object.entries( sectionsWithEntries )
		.filter( ( [ section, { entries } ] ) => entries && section !== 'invalid' );
}
