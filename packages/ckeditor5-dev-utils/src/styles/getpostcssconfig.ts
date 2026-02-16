/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import postCssImport from 'postcss-import';
import postCssMixins from 'postcss-mixins';
import postCssNesting from 'postcss-nesting';
import cssnano from 'cssnano';
import themeLogger from './themelogger.js';
import themeImporter from './themeimporter.js';
import type { Plugin, Processor } from 'postcss';

type GetPostCssConfigOptions = {

	/**
	 * When true, an inline source map will be built into the output CSS.
	 */
	sourceMap?: boolean;

	/**
	 * When true, the output CSS will be minified.
	 */
	minify?: boolean;
};

type PostCssConfig = {

	/**
	 * A PostCSS configuration object, e.g. to be used by the postcss-loader.
	 */
	plugins: Array<Plugin | Processor>;

	/**
	 * When true, an inline source map will be built into the output CSS.
	 */
	sourceMap?: string;
};

/**
 * Returns a PostCSS configuration to build the editor styles (e.g., used by postcss-loader).
 */
export default function getPostCssConfig( options: GetPostCssConfigOptions = {} ): PostCssConfig {
	const config: PostCssConfig = {
		plugins: [
			postCssImport(),
			themeImporter(),
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
			preset: 'default'
		} ) );
	}

	return config;
}
