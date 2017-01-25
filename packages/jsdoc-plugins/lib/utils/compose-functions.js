/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * @param {...Function} functions
 */
const composeFunctions = ( ...fns ) => {
	return ( result ) => {
		for ( const fn of fns ) {
			result = fn( result );
		}

		return result;
	};
};

module.exports = composeFunctions;
