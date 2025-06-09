/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';

/**
 * Sorts parsed files according to the rules:
 * 1. Entries with more scopes at the top.
 * 2. Entries with single scope grouped by scope and sorted by date within group.
 * 3. Entries with no scope at the bottom.
 */
export function sortEntriesByScopeAndDate( entries: Array<ParsedFile> ): Array<ParsedFile> {
	return entries.sort( ( a, b ) => {
		const aScopeCount = ( a.data.scope || [] ).length;
		const bScopeCount = ( b.data.scope || [] ).length;

		// // Both have single scope - group by scope name first
		if ( aScopeCount === 1 && bScopeCount === 1 ) {
			const aScope = a.data.scope![ 0 ];
			const bScope = b.data.scope![ 0 ];

			if ( aScope && bScope && aScope !== bScope ) {
				return aScope.localeCompare( bScope ); // Alphabetical scope order
			}

			// Same scope - sort by date (older first)
			return a.dateCreated.getTime() - b.dateCreated.getTime();
		}

		// Both have same amount of scopes - sort by date (older first)
		if ( aScopeCount === bScopeCount ) {
			return a.dateCreated.getTime() - b.dateCreated.getTime();
		}

		// Sort by amount of scopes
		return bScopeCount - aScopeCount;
	} );
}
