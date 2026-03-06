/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { resolveLoader } from './resolve-loader.js';
import { getLightningCssConfig } from '../styles/index.js';

type GetStylesLoaderOptions = {
	minify?: boolean;
	sourceMap?: boolean;
	extractToSeparateFile?: boolean;
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
		sourceMap?: boolean;
		lightningCssOptions?: object;
	};
};

export default function getStylesLoader( options: GetStylesLoaderOptions ): StylesLoader {
	const {
		minify = false,
		sourceMap = false,
		extractToSeparateFile = false
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

	const getCssLoader = () => ( {
		loader: resolveLoader( 'css-loader' ),
		options: {
			sourceMap
		}
	} );

	const getLightningCssLoader = () => ( {
		loader: path.join( import.meta.dirname, 'ck-lightningcss-loader.js' ),
		options: {
			lightningCssOptions: getLightningCssConfig( {
				minify,
				sourceMap
			} )
		}
	} );

	return {
		test: /\.css$/,
		use: [
			extractToSeparateFile ? getExtractedLoader() : getBundledLoader(),
			getCssLoader(),
			getLightningCssLoader()
		].filter( Boolean ) as Array<LoaderToUse>
	};
}
