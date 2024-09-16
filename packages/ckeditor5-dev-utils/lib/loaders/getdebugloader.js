/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/**
 * @param {Array.<String>} debugFlags
 * @returns {Object}
 */
export default function getDebugLoader( debugFlags ) {
	return {
		loader: path.join( __dirname, 'ck-debug-loader.js' ),
		options: { debugFlags }
	};
}
