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
 * Returns the accessible label for a favorite toggle action.
 */
export function getFavoriteActionLabel( isFavorite: boolean ): string {
	return isFavorite ? 'Remove from favorites' : 'Add to favorites';
}

/**
 * Updates a favorite button from the current favorite identifier set.
 */
export function updateFavoriteButtonState(
	button: HTMLButtonElement,
	favoriteIds: Set<string>,
	favoriteId: string
): void {
	const isFavorite = favoriteIds.has( favoriteId );
	const label = getFavoriteActionLabel( isFavorite );

	button.title = label;
	button.setAttribute( 'aria-label', label );
	button.setAttribute( 'aria-pressed', String( isFavorite ) );
	button.classList.toggle( 'favorite--active', isFavorite );
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
