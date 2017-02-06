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

	compiler.plugin( 'normal-module-factory', ( nmf ) => {
		nmf.plugin( 'after-resolve', ( data, done ) => {
			const packageNameRegExp = /\/ckeditor5-[^/]+\//;
			const match = data.resource.match( packageNameRegExp );

			if ( match ) {
				const index = data.resource.search( packageNameRegExp ) + match[ 0 ].length;
				const pathToPackage = data.resource.slice( 0, index );
				translationService.loadPackage( pathToPackage );
			}

			// Translation loader is injected when the file comes from ckeditor5-* packages.
			if ( data.resource.match( /\/ckeditor5-[^/]+\/src\/.+\.js$/ ) ) {
				data.loaders.unshift( path.join( __dirname, 'translate-source-loader.js' ) );
			}

			done( null, data );
		} );
	} );
};
