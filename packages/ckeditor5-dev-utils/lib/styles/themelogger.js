/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * A plugin that prepends a path to the file in the comment for each file
 * processed by PostCSS.
 *
 * @returns {Function} A PostCSS plugin.
 */
function themeLogger() {
	return {
		postcssPlugin: 'postcss-ckeditor5-theme-logger',
		Once( root ) {
			root.prepend( `/* ${ root.source.input.file } */ \n` );
		}
	};
}

themeLogger.postcss = true;

export default themeLogger;
