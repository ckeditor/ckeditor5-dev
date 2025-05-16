/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import postCssImport from 'postcss-import';
import postCssMixins from 'postcss-mixins';
import postCssNesting from 'postcss-nesting';
import cssnano from 'cssnano';
import themeLogger from './themelogger.js';
import themeImporter from './themeimporter.js';

/**
 * Returns a PostCSS configuration to build the editor styles (e.g. used by postcss-loader).
 *
 * @param {object} options
 * @param {boolean} options.sourceMap When true, an inline source map will be built into the output CSS.
 * @param {boolean} options.minify When true, the output CSS will be minified.
 * @param {ThemeImporterOptions} options.themeImporter Configuration of the theme-importer PostCSS plugin.
 * See the plugin to learn more.
 * @returns {object} A PostCSS configuration object, e.g. to be used by the postcss-loader.
 */
export default function getPostCssConfig( options = {} ) {
	const config = {
		plugins: [
			postCssImport(),
			themeImporter( options.themeImporter ),
			postCssMixins(),
			postCssNesting( {
				// https://github.com/ckeditor/ckeditor5/issues/11730
				noIsPseudoSelector: true,
				edition: '2021'
			} ),
			themeLogger()
		]
	};

	if ( options.sourceMap ) {
		config.sourceMap = 'inline';
	}

	if ( options.minify ) {
		config.plugins.push( cssnano( {
			preset: 'default',
			autoprefixer: false,
			reduceIdents: false
		} ) );
	}

	return config;
}
