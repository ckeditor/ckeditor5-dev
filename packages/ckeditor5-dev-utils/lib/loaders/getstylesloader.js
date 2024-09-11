/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { getPostCssConfig } from '../styles/index.js';

/**
 * @param {Object} options
 * @param {String} options.themePath
 * @param {Boolean} [options.minify]
 * @param {Boolean} [options.sourceMap]
 * @param {Boolean} [options.extractToSeparateFile]
 * @param {Boolean} [options.skipPostCssLoader]
 * @returns {Object}
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
