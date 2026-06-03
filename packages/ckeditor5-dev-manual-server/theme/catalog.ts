/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// @ts-expect-error Virtual module provided by the manual test entries plugin.
import { manualTestEntries, type ManualTestEntry } from 'virtual:ckeditor5-manual-entries';

import './catalog.css';

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

	root.replaceChildren( cloneTemplateElement( 'manual-index-template' ) );

	root.querySelector<HTMLElement>( '.app__subtitle' )!.textContent = `${ entries.length } tests across ${ packageCount } packages`;

	const listElement = root.querySelector<HTMLElement>( '.app__list' )!;
	const searchInput = root.querySelector<HTMLInputElement>( '.app__search-input' )!;

	const render = ( query: string ): void => {
		listElement.replaceChildren( ...renderGroups( filterEntries( entries, query ) ) );
	};

	searchInput.addEventListener( 'input', () => render( searchInput.value ) );

	document.addEventListener( 'keydown', event => {
		if ( event.key == '/' && document.activeElement != searchInput ) {
			event.preventDefault();
			searchInput.focus();
			searchInput.select();
		}
	} );

	render( '' );
}

/**
 * Returns entries matching the current search query.
 */
function filterEntries( entries: Array<ManualTestEntry>, query: string ): Array<ManualTestEntry> {
	const normalized = query.trim().toLowerCase();

	if ( !normalized ) {
		return entries;
	}

	return entries.filter( entry =>
		entry.packageName.toLowerCase().includes( normalized ) ||
		entry.slug.toLowerCase().includes( normalized ) ||
		entry.displayName.toLowerCase().includes( normalized )
	);
}

/**
 * Groups visible entries by package and renders package cards.
 */
function renderGroups( entries: Array<ManualTestEntry> ): Array<HTMLElement> {
	if ( !entries.length ) {
		return [ cloneTemplateElement( 'manual-empty-template' ) ];
	}

	const groups = new Map<string, Array<ManualTestEntry>>();

	for ( const entry of entries ) {
		const group = groups.get( entry.packageName ) || [];

		group.push( entry );
		groups.set( entry.packageName, group );
	}

	return [ ...groups.entries() ].map( ( [ packageName, packageEntries ] ) => renderPackageCard( packageName, packageEntries ) );
}

/**
 * Renders a single package card with all tests belonging to that package.
 */
function renderPackageCard( packageName: string, entries: Array<ManualTestEntry> ): HTMLElement {
	const packageCard = cloneTemplateElement( 'manual-package-template' );
	const list = packageCard.querySelector<HTMLElement>( '.pkg__list' )!;

	packageCard.querySelector<HTMLElement>( '.pkg__name' )!.textContent = packageName;
	packageCard.querySelector<HTMLElement>( '.pkg__count' )!.textContent = String( entries.length );
	list.replaceChildren( ...entries.map( entry => renderTestItem( entry ) ) );

	return packageCard;
}

/**
 * Renders a single test link inside a package card.
 */
function renderTestItem( entry: ManualTestEntry ): HTMLElement {
	const testItem = cloneTemplateElement( 'manual-test-template' );
	const link = testItem.querySelector<HTMLAnchorElement>( '.pkg__link' )!;

	link.href = entry.href;
	testItem.querySelector<HTMLElement>( '.pkg__test-name' )!.textContent = entry.displayName;
	testItem.querySelector<HTMLElement>( '.pkg__test-slug' )!.textContent = entry.slug;

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
