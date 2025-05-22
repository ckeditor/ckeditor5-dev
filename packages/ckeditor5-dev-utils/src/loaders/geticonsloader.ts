/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export default function getIconsLoader( { matchExtensionOnly = false }: { matchExtensionOnly?: boolean } = {} ): {
	test: RegExp;
	use: Array<string>;
} {
	return {
		test: matchExtensionOnly ? /\.svg$/ : /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
		use: [ 'raw-loader' ]
	};
}
