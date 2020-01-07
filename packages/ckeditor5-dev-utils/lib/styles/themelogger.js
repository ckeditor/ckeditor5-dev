/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

const postcss = require( 'postcss' );

/**
 * A plugin that prepends a path to the file in the comment for each file
 * processed by PostCSS.
 *
 * @returns {Function} A PostCSS plugin.
 */
module.exports = postcss.plugin( 'postcss-ckeditor5-theme-logger', () => {
	return root => root.prepend( `/* ${ root.source.input.file } */ \n` );
} );
