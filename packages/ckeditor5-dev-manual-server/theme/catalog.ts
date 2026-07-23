/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// @ts-expect-error Virtual module provided by the manual test entries plugin.
import { manualTestEntries, type ManualTestEntry } from 'virtual:ckeditor5-manual-entries';
import {
	filterFavoriteEntries,
	getFavoriteId,
	loadFavoriteIds,
	saveFavoriteIds,
	toggleFavoriteId
} from './catalog-favorites.js';
import { filterEntries, findMatchOffsets } from './catalog-search.js';

import './catalog.css';

const SEARCH_QUERY_PARAMETER = 'q';
const SEARCH_HIGHLIGHT_NAME = 'ckeditor5-manual-search-match';
const SEARCH_LABEL_SELECTOR = '.pkg__name, .pkg__test-name';

/**
 * Root element for the manual test index application.
 */
const appElement = document.querySelector<HTMLElement>( '#app' )!;

renderApp( appElement, manualTestEntries );

/**
 * Renders the index shell from the HTML template and wires filtering behavior.
 */
function renderApp( root: HTMLElement, entries: Array<ManualTestEntry> ): void {
	const packageCount = new Set( entries.map( entry => entry.packageName ) ).size;
	const favoriteIds = loadFavoriteIds();

	root.replaceChildren( cloneTemplateElement( 'manual-index-template' ) );

	root.querySelector<HTMLElement>( '.app__subtitle' )!.textContent = `${ entries.length } tests across ${ packageCount } packages`;

	const listElement = root.querySelector<HTMLElement>( '.app__list' )!;
	const searchInput = root.querySelector<HTMLInputElement>( '.app__search-input' )!;
	const clearSearchButton = root.querySelector<HTMLButtonElement>( '.app__search-clear' )!;

	const render = ( query: string ): void => {
		const normalizedQuery = query.trim().toLowerCase();
		const renderedGroups = renderGroups( filterEntries( entries, normalizedQuery ), favoriteIds );

		if ( !normalizedQuery ) {
			renderedGroups.unshift( renderFavoritesCard( entries, favoriteIds ) );
		}

		listElement.replaceChildren( ...renderedGroups );
		updateSearchHighlights( listElement, normalizedQuery );
	};

	const setQuery = ( query: string ): void => {
		searchInput.value = query;
		render( query );
	};

	const applySearchInput = (): void => {
		updateSearchQueryInUrl( searchInput.value );
		render( searchInput.value );
	};

	searchInput.addEventListener( 'input', applySearchInput );

	listElement.addEventListener( 'click', event => {
		const target = event.target;

		if ( !( target instanceof Element ) ) {
			return;
		}

		if ( target.closest( '.pkg__favorites-clear' ) ) {
			favoriteIds.clear();
			saveFavoriteIds( favoriteIds );
			render( searchInput.value );

			return;
		}

		const favoriteButton = target.closest<HTMLButtonElement>( '.pkg__favorite' );
		const favoriteId = favoriteButton?.dataset.favoriteId;

		if ( !favoriteId ) {
			return;
		}

		toggleFavoriteId( favoriteIds, favoriteId );
		saveFavoriteIds( favoriteIds );
		render( searchInput.value );
	} );

	clearSearchButton.addEventListener( 'click', () => {
		searchInput.value = '';
		searchInput.focus();

		applySearchInput();
	} );

	window.addEventListener( 'popstate', () => {
		setQuery( getSearchQueryFromUrl() );
	} );

	document.addEventListener( 'keydown', event => {
		if ( event.key == '/' && document.activeElement != searchInput ) {
			event.preventDefault();
			searchInput.focus();
			searchInput.select();
		}
	} );

	setQuery( getSearchQueryFromUrl() );
}

/**
 * Returns the current search query from the page URL.
 */
function getSearchQueryFromUrl(): string {
	return new URL( window.location.href ).searchParams.get( SEARCH_QUERY_PARAMETER ) || '';
}

/**
 * Updates the page URL to reflect the current search query.
 */
function updateSearchQueryInUrl( query: string ): void {
	if ( query == getSearchQueryFromUrl() ) {
		return;
	}

	const url = new URL( window.location.href );

	if ( query ) {
		url.searchParams.set( SEARCH_QUERY_PARAMETER, query );
	} else {
		url.searchParams.delete( SEARCH_QUERY_PARAMETER );
	}

	history.replaceState( null, '', `${ url.pathname }${ url.search }${ url.hash }` );
}

/**
 * Highlights query matches in the currently rendered package and test names.
 */
function updateSearchHighlights( root: HTMLElement, normalizedQuery: string ): void {
	if ( typeof CSS == 'undefined' || !( 'highlights' in CSS ) ) {
		return;
	}

	CSS.highlights.delete( SEARCH_HIGHLIGHT_NAME );

	if ( !normalizedQuery || typeof Highlight == 'undefined' ) {
		return;
	}

	const ranges: Array<Range> = [];

	for ( const label of root.querySelectorAll<HTMLElement>( SEARCH_LABEL_SELECTOR ) ) {
		const textNode = label.firstChild;

		if ( !textNode || textNode.nodeType != Node.TEXT_NODE ) {
			continue;
		}

		for ( const { start, end } of findMatchOffsets( textNode.textContent || '', normalizedQuery ) ) {
			const range = new Range();

			range.setStart( textNode, start );
			range.setEnd( textNode, end );
			ranges.push( range );
		}
	}

	if ( ranges.length ) {
		CSS.highlights.set( SEARCH_HIGHLIGHT_NAME, new Highlight( ...ranges ) );
	}
}

/**
 * Groups visible entries by package and renders package cards.
 */
function renderGroups( entries: Array<ManualTestEntry>, favoriteIds: Set<string> ): Array<HTMLElement> {
	if ( !entries.length ) {
		return [ cloneTemplateElement( 'manual-empty-template' ) ];
	}

	const groups = new Map<string, Array<ManualTestEntry>>();

	for ( const entry of entries ) {
		const group = groups.get( entry.packageName ) || [];

		group.push( entry );
		groups.set( entry.packageName, group );
	}

	return [ ...groups.entries() ].map( ( [ packageName, packageEntries ] ) =>
		renderPackageCard( packageName, packageEntries, favoriteIds )
	);
}

/**
 * Renders a single package card with all tests belonging to that package.
 */
function renderPackageCard( packageName: string, entries: Array<ManualTestEntry>, favoriteIds: Set<string> ): HTMLElement {
	const packageCard = cloneTemplateElement( 'manual-package-template' );
	const list = packageCard.querySelector<HTMLElement>( '.pkg__list' )!;

	packageCard.querySelector<HTMLElement>( '.pkg__name' )!.textContent = packageName;
	packageCard.querySelector<HTMLElement>( '.pkg__count' )!.textContent = String( entries.length );
	list.replaceChildren( ...entries.map( entry => renderTestItem( entry, favoriteIds ) ) );

	return packageCard;
}

/**
 * Renders the favorites card, including its empty state.
 */
function renderFavoritesCard( entries: Array<ManualTestEntry>, favoriteIds: Set<string> ): HTMLElement {
	const favoritesCard = cloneTemplateElement( 'manual-favorites-template' );
	const favoriteEntries = filterFavoriteEntries( entries, favoriteIds );
	const list = favoritesCard.querySelector<HTMLElement>( '.pkg__list' )!;
	const clearButton = favoritesCard.querySelector<HTMLButtonElement>( '.pkg__favorites-clear' )!;

	favoritesCard.querySelector<HTMLElement>( '.pkg__count' )!.textContent = String( favoriteEntries.length );
	clearButton.hidden = !favoriteEntries.length;

	if ( favoriteEntries.length ) {
		list.replaceChildren( ...favoriteEntries.map( entry => renderTestItem( entry, favoriteIds, true ) ) );
	} else {
		list.replaceChildren( cloneTemplateElement( 'manual-favorites-empty-template' ) );
	}

	return favoritesCard;
}

/**
 * Renders a single test link inside a package card.
 */
function renderTestItem( entry: ManualTestEntry, favoriteIds: Set<string>, showPackageName = false ): HTMLElement {
	const testItem = cloneTemplateElement( 'manual-test-template' );
	const link = testItem.querySelector<HTMLAnchorElement>( '.pkg__link' )!;
	const favoriteButton = testItem.querySelector<HTMLButtonElement>( '.pkg__favorite' )!;
	const favoriteId = getFavoriteId( entry );
	const isFavorite = favoriteIds.has( favoriteId );
	const favoriteButtonLabel = isFavorite ? 'Remove from favorites' : 'Add to favorites';

	link.href = entry.href;

	testItem.querySelector<HTMLElement>( '.pkg__test-name' )!.textContent = showPackageName ? favoriteId : entry.slug;

	favoriteButton.dataset.favoriteId = favoriteId;
	favoriteButton.title = favoriteButtonLabel;
	favoriteButton.setAttribute( 'aria-label', favoriteButtonLabel );
	favoriteButton.classList.toggle( 'pkg__favorite--active', isFavorite );

	return testItem;
}

/**
 * Clones a one-root HTML template used by the index UI.
 */
function cloneTemplateElement( templateId: string ): HTMLElement {
	const fragment = document
		.querySelector<HTMLTemplateElement>( `#${ templateId }` )!
		.content.cloneNode( true ) as DocumentFragment;

	return fragment.firstElementChild as HTMLElement;
}
