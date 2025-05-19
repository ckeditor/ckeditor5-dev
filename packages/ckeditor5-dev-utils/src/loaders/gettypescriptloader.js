/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import getDebugLoader from './getdebugloader.js';

/**
 * @param {object} [options]
 * @param {string} [options.configFile]
 * @param {Array.<string>} [options.debugFlags]
 * @param {boolean} [options.includeDebugLoader]
 * @returns {object}
 */
export default function getTypeScriptLoader( options = {} ) {
	const {
		configFile = 'tsconfig.json',
		debugFlags = [],
		includeDebugLoader = false
	} = options;

	return {
		test: /\.ts$/,
		use: [
			{
				loader: 'esbuild-loader',
				options: {
					target: 'es2022',
					tsconfig: configFile
				}
			},
			includeDebugLoader ? getDebugLoader( debugFlags ) : null
		].filter( Boolean )
	};
}
