/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @param {object} [options]
 * @param {boolean} [options.matchExtensionOnly]
 * @returns {object}
 */
export default function getIconsLoader( { matchExtensionOnly = false } = {} ) {
	return {
		test: matchExtensionOnly ? /\.svg$/ : /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
		use: [ 'raw-loader' ]
	};
}
