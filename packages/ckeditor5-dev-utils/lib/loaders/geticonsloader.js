/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @param {Object} [options]
 * @param {Boolean} [options.matchExtensionOnly]
 * @returns {Object}
 */
export default function getIconsLoader( { matchExtensionOnly = false } = {} ) {
	return {
		test: matchExtensionOnly ? /\.svg$/ : /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
		use: [ 'raw-loader' ]
	};
}
