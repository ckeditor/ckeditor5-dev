/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global window, document */

// eslint-disable-next-line mocha/no-top-level-hooks
afterEach( function() {
	let leaksCount = 0;
	const lines = [];

	Array.from( document.body.children ).forEach( el => {
		if ( !this._lastDomElements.has( el ) ) {
			const html = el.outerHTML.length > 80 ?
				el.outerHTML.substr( 0, 77 ) + '...' :
				el.outerHTML;
			lines.push( html );
			leaksCount++;
		}
	} );

	if ( leaksCount ) {
		const errorMessage = `Elements leaked (${ leaksCount }):\n` +
			lines.join( '\n' ) + '\n' +
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
