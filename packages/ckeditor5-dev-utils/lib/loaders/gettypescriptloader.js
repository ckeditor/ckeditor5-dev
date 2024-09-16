/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import getDebugLoader from './getdebugloader.js';

/**
 * @param {Object} [options]
 * @param {String} [options.configFile]
 * @param {Array.<String>} [options.debugFlags]
 * @param {Boolean} [options.includeDebugLoader]
 * @returns {Object}
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
