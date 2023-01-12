/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const seeValidator = require( './see-validator' );
const linkValidator = require( './link-validator' );
const firesValidator = require( './fires-validator' );
const overloadsValidator = require( './overloads-validator' );
const { getSource } = require( './utils' );

/**
 * Validates the CKEditor 5 documentation.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Object} typeDoc A TypeDoc application instance.
 * @returns {Boolean}
 */
module.exports = {
	validate( project, typeDoc ) {
		const validators = [
			seeValidator,
			linkValidator,
			firesValidator,
			overloadsValidator
		];

		typeDoc.logger.info( 'Starting validation...' );

		// The same error can be reported twice:
		//
		// 1. When processing types and events (comments are copied from a type to an event).
		// 2. When a parent class defines an invalid link, inherited members link to the invalid link too.
		const errors = new Map();

		for ( const validator of validators ) {
			validator( project, ( error, reflection ) => {
				const source = getSource( reflection );

				errors.set( `${ error } ${ source }`, {
					error,
					reflection,
					source
				} );
			} );
		}

		const errorsNoSource = new Set();

		errors.forEach( ( { error, reflection, source } ) => {
			const symbol = project.getSymbolFromReflection( reflection );

			if ( !symbol ) {
				errorsNoSource.add( `${ error } ${ chalk.grey( '(./' + source + ')' ) }` );
			} else {
				const node = symbol.declarations[ 0 ];

				typeDoc.logger.warn( error, node );
			}
		} );

		errorsNoSource.forEach( error => {
			typeDoc.logger.warn( error );
		} );

		typeDoc.logger.info( 'Validation completed.' );

		return !errors.size;
	}
};
