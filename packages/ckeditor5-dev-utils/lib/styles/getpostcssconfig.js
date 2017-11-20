/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

module.exports = function getPostCssConfig( options = {} ) {
	const config = {
		plugins: [
			require( 'postcss-import' )(),
			require( './themeimporter' )( options.themeimporter ),
			require( 'postcss-mixins' )(),
			require( 'postcss-custom-selectors' )(),
			require( 'postcss-nesting' )(),
			require( './themelogger' )(),
		]
	};

	if ( options.sourceMap ) {
		config.sourceMap = 'inline';
	}

	if ( options.minify ) {
		config.plugins.push( require( 'cssnano' )( {
			preset: 'default',
			autoprefixer: false
		} ) );
	}

	return config;
};
