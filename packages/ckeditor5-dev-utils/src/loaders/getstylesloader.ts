/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { resolveLoader } from './resolve-loader.js';
import { getPostCssConfig } from '../styles/index.js';

type GetStylesLoaderOptions = {
	themePath: string;
	minify?: boolean;
	sourceMap?: boolean;
	extractToSeparateFile?: boolean;
	skipPostCssLoader?: boolean;
};

type StylesLoader = {
	test: RegExp;
	use: Array<LoaderToUse>;
};

type LoaderToUse = string | {
	loader: string;
	options?: {
		injectType?: string;
		attributes?: {
			'data-cke': boolean;
		};
		postcssOptions?: object;
	};
};

export default function getStylesLoader( options: GetStylesLoaderOptions ): StylesLoader {
	const {
		themePath,
		minify = false,
		sourceMap = false,
		extractToSeparateFile = false,
		skipPostCssLoader = false
	} = options;

	const getBundledLoader = () => ( {
		loader: resolveLoader( 'style-loader' ),
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
			resolveLoader( 'css-loader' ),
			skipPostCssLoader ? null : {
				loader: resolveLoader( 'postcss-loader' ),
				options: {
					postcssOptions: getPostCssConfig( {
						themeImporter: { themePath },
						minify,
						sourceMap
					} )
				}
			}
		].filter( Boolean ) as Array<LoaderToUse>
	};
}
