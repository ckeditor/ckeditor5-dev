/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parse, isValid } from 'date-fns';
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
			const aDate = extractDateFromFilename( a.changesetPath );
			const bDate = extractDateFromFilename( b.changesetPath );
			return aDate.getTime() - bDate.getTime();
		}

		// Both have same amount of scopes - sort by date (older first)
		if ( aScopeCount === bScopeCount ) {
			const aDate = extractDateFromFilename( a.changesetPath );
			const bDate = extractDateFromFilename( b.changesetPath );
			return aDate.getTime() - bDate.getTime();
		}

		// Sort by amount of scopes
		return bScopeCount - aScopeCount;
	} );
}

/**
 * Extracts date from changeset filename.
 * Expects format: YYYYMMDDHHMMSS_description.md
 */
function extractDateFromFilename( changesetPath: string ): Date {
	const filename = changesetPath.split( '/' ).pop() || '';
	const dateMatch = filename.match( /^(\d{14})_/ );

	if ( !dateMatch || !dateMatch[ 1 ] ) {
		// Fallback to current date if no date pattern found
		return new Date();
	}

	const dateStr = dateMatch[ 1 ];
	const parsedDate = parse( dateStr, 'yyyyMMddHHmmss', new Date() );

	// Validate the parsed date
	if ( !isValid( parsedDate ) ) {
		// Fallback to current date if parsing failed
		return new Date();
	}

	return parsedDate;
}
