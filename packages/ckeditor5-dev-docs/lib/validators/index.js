/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
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
		const log = logger();

		const validators = [
			seeValidator,
			linkValidator,
			firesValidator,
			overloadsValidator
		];

		let result = true;

		log.info( 'Starting validation...' );

		for ( const validator of validators ) {
			const errors = new Set();

			validator( project, error => {
				result = false;

				errors.add( error );
			} );

			errors.forEach( error => log.warning( error ) );
		}

		log.info( 'Validation completed.' );

		return result;
	}
};
