/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const {
	getAllTranslations,
	replaceFirstFunctionParameter,
	createTranslator
} = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Replaces all function call parameters with translated strings for the t function.
 *
 * @param {Object} compiler Webpack compiler.
 * @param {String} language Language code, e.g en_US.
 */
module.exports = function replaceTranslationCallsForOneLangauge( compiler, language ) {
	const packageNames = new Set();

	compiler.plugin( 'after-resolvers', ( compiler ) => {
		compiler.resolvers.normal.plugin( 'before-resolve', ( obj, done ) => {
			const match = obj.request.match( /@ckeditor[\\\/]([^\\\/]+)/ );

			if ( match ) {
				packageNames.add( match[ 1 ] );
			}

			done();
		} );
	} );

	compiler.plugin( 'emit', ( options, done ) => {
		const allTranslations = getAllTranslations( packageNames, language );

		for ( const assetName in options.assets ) {
			replaceTCalls( options.assets[ assetName ], allTranslations );
		}

		done();
	} );
};

function replaceTCalls( assetContent, allTranslations ) {
	const source = replaceFirstFunctionParameter( assetContent.source(), 't', createTranslator( allTranslations ) );
	assetContent.source = () => source;
	assetContent.size = () => source.length;
}
