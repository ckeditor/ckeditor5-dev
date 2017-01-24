/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = function injectTranslations( compiler, translations ) {
	console.log( translations );
	const packages = new Set();

	compiler.plugin( 'after-resolvers', ( compiler ) => {
		compiler.resolvers.normal.plugin( 'before-resolve', ( obj, done ) => {
			const packageNameMatch = obj.request.match( /\@ckeditor[\/\\]([^\/\\]+)/ );

			if ( packageNameMatch ) {
				packages.add( packageNameMatch[1] );
			}

			done();
		} );
	} );

	compiler.plugin( 'after-compile', ( compilation, done ) => {
		console.log( Object.keys( compilation.assets ) );
		done();
	} );

	compiler.plugin( 'emit', ( output, done ) => {
		console.log( output.chunks );
		done();
	} );
};
