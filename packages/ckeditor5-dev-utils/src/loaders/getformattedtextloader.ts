/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { resolveLoader } from './resolve-loader.js';

export default function getFormattedTextLoader(): { test: RegExp; use: Array<string> } {
	return {
		test: /\.(txt|html|rtf)$/,
		use: [ resolveLoader( 'raw-loader' ) ]
	};
}
