#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

/**
 * Extracts base URL from the provided page URL. Base URL consists of a protocol, a host, a port, and a path.
 * A hash and search parts are omitted, because they would have navigated to the same page if they were set.
 *
 * @param {String} url Page URL.
 * @returns {String} Base URL from page URL.
 */
function getBaseUrl( url ) {
	const { origin, pathname } = new URL( url );

	return `${ origin }${ pathname }`;
}

/**
 * Checks, if provided string is a valid URL utilizing the HTTP or HTTPS protocols.
 *
 * @param {String} url The URL to validate.
 * @returns {Boolean}
 */
function isUrlValid( url ) {
	try {
		return [ 'http:', 'https:' ].includes( new URL( url ).protocol );
	} catch ( error ) {
		return false;
	}
}

/**
 * Transforms any value to an array. If the provided value is already an array, it is returned unchanged.
 *
 * @param {*} data The value to transform to an array.
 * @returns {Array.<*>} An array created from data.
 */
function toArray( data ) {
	return Array.isArray( data ) ? data : [ data ];
}

module.exports = {
	getBaseUrl,
	isUrlValid,
	toArray
};
