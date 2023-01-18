/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global document, window */

const toggleButton = document.querySelector( '.manual-test-sidebar__toggle' );
const container = document.body;
const pinnedCSSClass = 'manual-test-container_pinned-sidebar';
const localStorageKey = 'cke5-manual-test-sidebar-pinned';
const isSidebarPinned = window.localStorage.getItem( localStorageKey );

if ( isSidebarPinned === 'true' ) {
	container.classList.add( pinnedCSSClass );
}

// The "manual-test-container_no-transitions" class prevents CSS transitions when the page is loaded,
// for instance, seeing the sidebar animate on every refresh is pretty annoying. Once the webpage is loaded,
// the class can be removed and all transitions in the sidebar can work as expected.
document.addEventListener( 'DOMContentLoaded', () => {
	container.classList.remove( 'manual-test-container_no-transitions' );
} );

toggleButton.addEventListener( 'click', () => {
	container.classList.toggle( pinnedCSSClass );

	window.localStorage.setItem( localStorageKey, container.classList.contains( pinnedCSSClass ) );
} );
