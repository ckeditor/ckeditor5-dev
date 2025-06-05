/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'upath';
import type { Entry, SectionsWithEntries } from '../types.js';

/**
 * Extracts timestamp from changeset file path.
 * Expected format: .changelog/YYYYMMDDHHMMSS_branch.md
 * If the timestamp is missing or invalid, returns Date.now() and logs a warning.
 */
export function extractTimestampFromPath( changesetPath: string ): number {
	const filename = path.basename( changesetPath, '.md' );
	const timestampMatch = filename.match( /^(\d{14})_/ );

	if ( !timestampMatch || !timestampMatch[ 1 ] ) {
		console.warn(
			`Warning: Changeset file "${ changesetPath }" does not follow the expected format ` +
			'YYYYMMDDHHMMSS_branch.md. Using current timestamp for sorting.'
		);
		return Date.now();
	}

	const timestampStr = timestampMatch[ 1 ];
	const year = parseInt( timestampStr.substring( 0, 4 ), 10 );
	const month = parseInt( timestampStr.substring( 4, 6 ), 10 ) - 1; // Month is 0-indexed
	const day = parseInt( timestampStr.substring( 6, 8 ), 10 );
	const hour = parseInt( timestampStr.substring( 8, 10 ), 10 );
	const minute = parseInt( timestampStr.substring( 10, 12 ), 10 );
	const second = parseInt( timestampStr.substring( 12, 14 ), 10 );

	const date = new Date( year, month, day, hour, minute, second );

	if ( isNaN( date.getTime() ) ) {
		console.warn( `Warning: Invalid timestamp in changeset file "${ changesetPath }". Using current timestamp for sorting.` );
		return Date.now();
	}

	return date.getTime();
}

/**
 * Sorts entries according to the specified criteria:
 * 1. By creation time (oldest first)
 * 2. Entries with many scopes at the top
 * 3. Entries with packages sorted alphabetically
 * 4. Entries without packages at the bottom
 */
export function sortEntries( entries: Array<Entry> ): Array<Entry> {
	return entries.sort( ( a, b ) => {
		// First, sort by creation time (oldest first)
		const timestampA = extractTimestampFromPath( a.changesetPath );
		const timestampB = extractTimestampFromPath( b.changesetPath );

		if ( timestampA !== timestampB ) {
			return timestampA - timestampB;
		}

		// Then, sort by scope criteria
		const scopeA = a.data.scope || [];
		const scopeB = b.data.scope || [];

		// Entries without packages go to the bottom
		if ( scopeA.length === 0 && scopeB.length > 0 ) {
			return 1;
		}
		if ( scopeA.length > 0 && scopeB.length === 0 ) {
			return -1;
		}

		// If both have no scopes, maintain timestamp order
		if ( scopeA.length === 0 && scopeB.length === 0 ) {
			return 0;
		}

		// Entries with many scopes go to the top
		if ( scopeA.length !== scopeB.length ) {
			return scopeB.length - scopeA.length;
		}

		// If same number of scopes, sort alphabetically by first scope
		const firstScopeA = scopeA[ 0 ] || '';
		const firstScopeB = scopeB[ 0 ] || '';

		return firstScopeA.localeCompare( firstScopeB );
	} );
}

/**
 * Sorts all entries within each section of the sections object.
 */
export function sortSectionEntries( sections: SectionsWithEntries ): SectionsWithEntries {
	const sortedSections = { ...sections };

	for ( const sectionKey in sortedSections ) {
		const sectionName = sectionKey as keyof SectionsWithEntries;
		sortedSections[ sectionName ] = {
			...sortedSections[ sectionName ],
			entries: sortEntries( sortedSections[ sectionName ].entries )
		};
	}

	return sortedSections;
}
