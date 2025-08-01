/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export default function getLicenseBanner(): string {
	const date = new Date();

	// License banner starts with `!`. That combines with uglifyjs' `comments` /^!/ option
	// make webpack preserve that banner while cleaning code from others comments during the build task.
	// It's because UglifyJsWebpackPlugin minification takes place after adding a banner.

	/* eslint-disable @stylistic/indent */
	return (
`/*!
 * @license Copyright (c) 2003-${ date.getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */`
	);
	/* eslint-enable @stylistic/indent */
}
