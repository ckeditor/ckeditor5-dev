/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global window, document */

// eslint-disable-next-line mocha/no-top-level-hooks
afterEach( function() {
	if ( document.body.childElementCount !== this._lastDomElementsCount ) {
		const leaksCount = document.body.childElementCount - this._lastDomElementsCount;
		const errorMessage = `${ leaksCount } elements were leaked. Be a good citizen and clean your DOM once you're done with it.`;

		this._lastDomElementsCount = document.body.childElementCount;

		// See https://github.com/ckeditor/ckeditor5-dev/issues/586#issuecomment-571573488.
		if ( window.production ) {
			throw new Error( errorMessage );
		} else {
			console.error( errorMessage );
		}
	}
} );
