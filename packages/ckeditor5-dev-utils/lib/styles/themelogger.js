/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

/**
 * A plugin that prepends a path to the file in the comment for each file
 * processed by PostCSS.
 *
 * @returns {Object} A PostCSS plugin.
 */
module.exports = () => {
	return {
		postcssPlugin: 'postcss-ckeditor5-theme-logger',
		Once( root ) {
			return root.prepend( `/* ${ root.source.input.file } */ \n` );
		}
	};
};

module.exports.postcss = true;
