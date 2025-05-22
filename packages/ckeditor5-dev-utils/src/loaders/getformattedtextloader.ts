/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export default function getFormattedTextLoader(): { test: RegExp; use: Array<string> } {
	return {
		test: /\.(txt|html|rtf)$/,
		use: [ 'raw-loader' ]
	};
}
