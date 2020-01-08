/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global window, document */

( function() {
	let lastDomElementsCount;

	beforeEach( () => {
		lastDomElementsCount = document.body.childElementCount;
	} );

	afterEach( () => {
		if ( document.body.childElementCount !== lastDomElementsCount ) {
			const leaksCount = document.body.childElementCount - lastDomElementsCount;
			const errorMessage = `${ leaksCount } elements were leaked. Be a good citizen and clean your DOM once you're done with it.`;

			lastDomElementsCount = document.body.childElementCount;

			// See https://github.com/ckeditor/ckeditor5-dev/issues/586#issuecomment-571573488.
			if ( window.production ) {
				throw new Error( errorMessage );
			} else {
				console.error( errorMessage );
			}
		}
	} );
}() );
