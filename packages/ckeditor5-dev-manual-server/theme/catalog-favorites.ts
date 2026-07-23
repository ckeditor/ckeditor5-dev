/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

interface FavoritableEntry {
	packageName: string;
	slug: string;
}

const FAVORITES_STORAGE_KEY = 'ckeditor5-manual-test-favorites';

/**
 * Returns the stable identifier used to persist a manual test as a favorite.
 */
export function getFavoriteId( entry: FavoritableEntry ): string {
	return `${ entry.packageName }/${ entry.slug }`;
}

/**
 * Returns favorite entries in their original order.
 */
export function filterFavoriteEntries<T extends FavoritableEntry>( entries: Array<T>, favoriteIds: Set<string> ): Array<T> {
	return entries.filter( entry => favoriteIds.has( getFavoriteId( entry ) ) );
}

/**
 * Toggles an identifier in the favorite set.
 */
export function toggleFavoriteId( favoriteIds: Set<string>, favoriteId: string ): void {
	if ( favoriteIds.has( favoriteId ) ) {
		favoriteIds.delete( favoriteId );
	} else {
		favoriteIds.add( favoriteId );
	}
}

/**
 * Loads favorite entry identifiers from local storage.
 */
export function loadFavoriteIds(): Set<string> {
	try {
		const storedValue = localStorage.getItem( FAVORITES_STORAGE_KEY );

		if ( !storedValue ) {
			return new Set();
		}

		const parsedValue: unknown = JSON.parse( storedValue );

		if ( !Array.isArray( parsedValue ) || parsedValue.some( value => typeof value != 'string' ) ) {
			return new Set();
		}

		return new Set( parsedValue );
	} catch {
		return new Set();
	}
}

/**
 * Persists favorite entry identifiers in local storage.
 */
export function saveFavoriteIds( favoriteIds: Set<string> ): void {
	try {
		localStorage.setItem( FAVORITES_STORAGE_KEY, JSON.stringify( [ ...favoriteIds ] ) );
	} catch {
		// Favorites are optional, so storage failures must not block the catalog.
	}
}
