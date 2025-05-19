/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { getPostCssConfig } from '../styles/index.js';

/**
 * @param {object} options
 * @param {string} options.themePath
 * @param {boolean} [options.minify]
 * @param {boolean} [options.sourceMap]
 * @param {boolean} [options.extractToSeparateFile]
 * @param {boolean} [options.skipPostCssLoader]
 * @returns {object}
 */
export default function getStylesLoader( options ) {
	const {
		themePath,
		minify = false,
		sourceMap = false,
		extractToSeparateFile = false,
		skipPostCssLoader = false
	} = options;

	const getBundledLoader = () => ( {
		loader: 'style-loader',
		options: {
			injectType: 'singletonStyleTag',
			attributes: {
				'data-cke': true
			}
		}
	} );

	const getExtractedLoader = () => {
		return MiniCssExtractPlugin.loader;
	};

	return {
		test: /\.css$/,
		use: [
			extractToSeparateFile ? getExtractedLoader() : getBundledLoader(),
			'css-loader',
			skipPostCssLoader ? null : {
				loader: 'postcss-loader',
				options: {
					postcssOptions: getPostCssConfig( {
						themeImporter: { themePath },
						minify,
						sourceMap
					} )
				}
			}
		].filter( Boolean )
	};
}
