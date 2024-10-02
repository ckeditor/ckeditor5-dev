/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @returns {object}
 */
export default function getFormattedTextLoader() {
	return {
		test: /\.(txt|html|rtf)$/,
		use: [ 'raw-loader' ]
	};
}
