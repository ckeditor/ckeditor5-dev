/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';

type DebugLoaderOptions = {
	loader: string;
	options: {
		debugFlags: Array<string>;
	};
};

/**
 * @param {Array.<string>} debugFlags
 * @returns {object}
 */
export default function getDebugLoader( debugFlags: Array<string> ): DebugLoaderOptions {
	return {
		loader: path.join( import.meta.dirname, 'ck-debug-loader.js' ),
		options: { debugFlags }
	};
}
