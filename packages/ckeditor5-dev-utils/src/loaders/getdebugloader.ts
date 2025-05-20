/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

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
		loader: path.join( __dirname, 'ck-debug-loader.js' ),
		options: { debugFlags }
	};
}
