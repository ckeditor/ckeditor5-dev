/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = function getLicenseBanner() {
	const date = new Date();

	return (
`/**
 * @license Copyright (c) 2003-${ date.getFullYear() }, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */`
	);
};
