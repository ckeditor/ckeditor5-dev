/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const semver = require( 'semver' );

/**
 * @param {String} version
 * @returns {String}
 */
module.exports = function getNpmTagFromVersion( version ) {
	const [ versionTag ] = semver.prerelease( version ) || [ 'latest' ];

	return versionTag;
};
