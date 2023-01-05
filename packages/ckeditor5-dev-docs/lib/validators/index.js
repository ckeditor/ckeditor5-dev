/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const seeValidator = require( './see-validator' );
const linkValidator = require( './link-validator' );
const firesValidator = require( './fires-validator' );
const overloadsValidator = require( './overloads-validator' );

/**
 * Validates the CKEditor 5 documentation.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @returns {Boolean}
 */
module.exports = {
	validate( project ) {
		const validators = [
			seeValidator,
			linkValidator,
			firesValidator,
			overloadsValidator
		];

		let result = true;

		console.log( 'Starting validation...' );

		for ( const validator of validators ) {
			const errors = new Set();

			validator( project, error => {
				result = false;

				errors.add( error );
			} );

			errors.forEach( error => console.warn( error ) );
		}

		console.log( 'Validation completed.' );

		return result;
	}
};
