/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const {	TranslationService } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

/**
 * Replaces all function call parameters with translated strings for the t function.
 *
 * @param {Object} compiler Webpack compiler.
 * @param {String} language Language code, e.g en_US.
 */
module.exports = function replaceTranslationCallsForOneLangauge( compiler, language ) {
	const translationService = new TranslationService( language );

	compiler.options.translateString = ( originalString ) => translationService.translateString( originalString );

	compiler.plugin( 'after-resolvers', ( compiler ) => {
		compiler.resolvers.normal.plugin( 'before-resolve', ( obj, done ) => {
			const match = obj.request.match( /@ckeditor[\\\/]([^\\\/]+)/ );

			if ( match ) {
				translationService.loadPackage( match[ 1 ] );
			}

			done();
		} );
	} );
};
