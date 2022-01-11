/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const utils = {
	/**
	 * Checks whether specified `properties` are specified in the `objectToCheck` object.
	 *
	 * Throws an error if any property is missing.
	 *
	 * @param {Object} objectToCheck
	 * @param {Array.<String>} properties
	 */
	verifyProperties( objectToCheck, properties ) {
		const nonExistingProperties = properties.filter( property => objectToCheck[ property ] === undefined );

		if ( nonExistingProperties.length ) {
			throw new Error( `The specified object misses the following properties: ${ nonExistingProperties.join( ', ' ) }.` );
		}
	}
};

module.exports = utils;
