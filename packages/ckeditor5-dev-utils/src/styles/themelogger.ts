/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Plugin } from 'postcss';

/**
 * A plugin that prepends a path to the file in the comment for each file
 * processed by PostCSS.
 */
function themeLogger(): Plugin {
	return {
		postcssPlugin: 'postcss-ckeditor5-theme-logger',
		Once( root ) {
			root.prepend( `/* ${ root.source!.input.file } */ \n` );
		}
	};
}

themeLogger.postcss = true;

export default themeLogger;
