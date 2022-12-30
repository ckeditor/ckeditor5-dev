/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const seeValidator = require( './see-validator' );
const overloadsValidator = require( './overloads-validator' );

/**
 * Validates the CKEditor 5 documentation.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 *
 * @returns {Boolean}
 */
module.exports = {
	validate( project, options = {} ) {
		const validators = [
			seeValidator,
			overloadsValidator
		];

		let result = true;

		console.log( 'Starting validation...' );

		for ( const validator of validators ) {
			validator( project, error => {
				result = false;

				console.warn( error );

				if ( options.strictMode ) {
					return result;
				}
			} );
		}

		console.log( 'Validation completed.' );

		return result;
	}
};
