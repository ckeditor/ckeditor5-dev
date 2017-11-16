/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

const postcss = require( 'postcss' );

module.exports = postcss.plugin( 'postcss-ckeditor5-theme-logger', () => {
	return root => root.prepend( `/* ${ root.source.input.file } */ \n` );
} );
