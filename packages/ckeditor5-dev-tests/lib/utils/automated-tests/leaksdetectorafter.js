/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global window, document */

// eslint-disable-next-line mocha/no-top-level-hooks
afterEach( function() {
	const leakedElementMarkups = Array.from( document.body.children ).filter( el => !this._lastDomElements.has( el ) ).map( el => {
		const html = el.outerHTML.length > 80 ?
			el.outerHTML.substr( 0, 77 ) + '...' :
			el.outerHTML;
		return html;
	} );

	if ( leakedElementMarkups.length ) {
		const errorMessage = `Elements leaked (${ leakedElementMarkups.length }):\n` +
			leakedElementMarkups.join( '\n' ) + '\n' +
			'Be a good citizen and clean your DOM once you\'re done with it.';

		this._lastDomElements = null;

		// See https://github.com/ckeditor/ckeditor5-dev/issues/586#issuecomment-571573488.
		if ( window.production ) {
			throw new Error( errorMessage );
		} else {
			console.error( errorMessage );
		}
	}
} );
