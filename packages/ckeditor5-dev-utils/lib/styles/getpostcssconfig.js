/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

const postCssImport = require( 'postcss-import' );
const postCssNext = require( 'postcss-cssnext' );
const postCssMixins = require( 'postcss-mixins' );
const themeImporter = require( './themeimporter' );
const cssnano = require( 'cssnano' );

module.exports = function getPostCssConfig( options ) {
	const config = {
		plugins: [
			postCssImport(),
			themeImporter( options ),
			postCssMixins(),
			postCssNext(),
		]
	};

	if ( options.sourceMap ) {
		config.sourceMap = 'inline';
	}

	if ( options.minify ) {
		config.plugins.push( cssnano( {
			preset: 'default',
			autoprefixer: false
		} ) );
	}

	return config;
};
