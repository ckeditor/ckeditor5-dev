/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import getDebugLoader from './getdebugloader.js';

/**
 * @param {Object} options
 * @param {Array.<String>} options.debugFlags
 * @returns {Object}
 */
export default function getJavaScriptLoader( { debugFlags } ) {
	return {
		test: /\.js$/,
		...getDebugLoader( debugFlags )
	};
}
