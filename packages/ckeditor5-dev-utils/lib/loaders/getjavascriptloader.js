/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import getDebugLoader from './getdebugloader.js';

/**
 * @param {object} options
 * @param {Array.<string>} options.debugFlags
 * @returns {object}
 */
export default function getJavaScriptLoader( { debugFlags } ) {
	return {
		test: /\.js$/,
		...getDebugLoader( debugFlags )
	};
}
