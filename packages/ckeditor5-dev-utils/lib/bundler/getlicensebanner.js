/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = function getLicenseBanner() {
	const date = new Date();

	/* eslint-disable indent */
	return (
`/**
 * @license Copyright (c) 2003-${ date.getFullYear() }, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */`
	);
	/* eslint-enable indent */
};
