/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const {	TranslationService } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

/**
 * Replaces all function call parameters with translated strings for the t function.
 *
 * @param {Object} compiler Webpack compiler.
 * @param {String} language Language code, e.g en_US.
 */
module.exports = function replaceTranslationCallsForOneLangauge( compiler, language ) {
	const translationService = new TranslationService( language );

	compiler.options.translateSource = ( source ) => translationService.translateSource( source );

	compiler.plugin( 'after-resolvers', ( compiler ) => {
		compiler.resolvers.normal.plugin( 'before-resolve', ( obj, done ) => {
			const match = obj.request.match( /@ckeditor[\\\/]([^\\\/]+)/ );

			if ( match ) {
				translationService.loadPackage( match[ 1 ] );
			}

			done();
		} );
	} );

	compiler.plugin( 'normal-module-factory', ( nmf ) => {
		nmf.plugin( 'after-resolve', ( data, done ) => {
			// Here the loader is injected.
			// TODO: add test /ckeditor5-[^/]+\/src\/.+\.js$/ to the path.
			data.loaders.unshift( path.join( __dirname, 'translate-source-loader.js' ) );
			done( null, data );
		} );
	} );
};
