/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import getDebugLoader from './getdebugloader.js';
import { resolveLoader } from './resolve-loader.js';

type TypeScriptLoaderOptions = {
	configFile?: string;
	debugFlags?: Array<string>;
	includeDebugLoader?: boolean;
};

type TypeScriptLoader = {
	test: RegExp;
	use: Array<LoaderToUse>;
};

type LoaderToUse = {
	loader: string;
	options: {
		target: string;
		tsconfig: string;
	};
};

export default function getTypeScriptLoader( options: TypeScriptLoaderOptions = {} ): TypeScriptLoader {
	const {
		configFile = 'tsconfig.json',
		debugFlags = [],
		includeDebugLoader = false
	} = options;

	return {
		test: /\.ts$/,
		use: [
			{
				loader: resolveLoader( 'esbuild-loader' ),
				options: {
					target: 'es2022',
					tsconfig: configFile
				}
			},
			includeDebugLoader ? getDebugLoader( debugFlags ) : null
		].filter( Boolean ) as Array<LoaderToUse>
	};
}
