/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';

/**
 * Sorts parsed files according to the rules:
 * 1. Entries with more scopes at the top.
 * 2. Entries with single scope grouped by scope and sorted by date within a group.
 * 3. Entries with no scope at the bottom.
 */
export function sortEntriesByScopeAndDate( entries: Array<ParsedFile> ): Array<ParsedFile> {
	return entries.sort( ( itemBefore, itemAfter ) => {
		const beforeScopeCount = itemBefore.data.scope.length;
		const afterScopeCount = itemAfter.data.scope.length;

		// Both have single scope - group by scope name first.
		if ( beforeScopeCount === 1 && afterScopeCount === 1 ) {
			const firstScope = itemBefore.data.scope.at( 0 )!;
			const secondScope = itemAfter.data.scope.at( 0 )!;

			if ( firstScope !== secondScope ) {
				return firstScope.localeCompare( secondScope ); // Alphabetical scope order.
			}

			// Same scope - sort by date (older first).
			return itemBefore.createdAt.getTime() - itemAfter.createdAt.getTime();
		}

		// Both have the same number of scopes - sort by date (older first).
		if ( beforeScopeCount === afterScopeCount ) {
			return itemBefore.createdAt.getTime() - itemAfter.createdAt.getTime();
		}

		// Sort by number of scopes.
		return afterScopeCount - beforeScopeCount;
	} );
}
