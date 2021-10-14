/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

const semver = require( 'semver' );
const postcss = require( 'postcss' );
const { version: postcssVersion } = require( 'postcss/package.json' );

const PLUGIN_NAME = 'postcss-ckeditor5-theme-logger';

/**
 * A plugin that prepends a path to the file in the comment for each file
 * processed by PostCSS.
 *
 * @returns {Function|Object} A PostCSS plugin.
 */
// PostCSS 8+.
if ( semver.gte( postcssVersion, '8.0.0' ) ) {
	module.exports = () => {
		return {
			postcssPlugin: PLUGIN_NAME,
			Once( root ) {
				return themeLoggerPlugin( root );
			}
		};
	};

	module.exports.postcss = true;
}
// PostCSS <8.
else {
	module.exports = postcss.plugin( PLUGIN_NAME, () => {
		return root => themeLoggerPlugin( root );
	} );
}

function themeLoggerPlugin( root ) {
	return root.prepend( `/* ${ root.source.input.file } */\n` );
}
