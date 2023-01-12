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
				const symbol = project.getSymbolFromReflection( reflection );
				const source = getSource( reflection );

				errors.set( `${ error } ${ source.fileName }:${ source.line }`, {
					error,
					symbol,
					source
				} );
			} );
		}

		[ ...errors.values() ]
			// Sort the errors so that the ones with the found symbol are listed first, followed by the rest.
			.sort( ( entryA, entryB ) => {
				if ( entryA.symbol && !entryB.symbol ) {
					return -1;
				}

				if ( !entryA.symbol && entryB.symbol ) {
					return 1;
				}

				return 0;
			} )
			// Print each error in the console.
			.forEach( entry => {
				if ( !entry.symbol ) {
					const pathToSource = `${ chalk.cyan( './' + entry.source.fileName ) }:${ chalk.yellow( entry.source.line ) }`;

					typeDoc.logger.warn( `${ pathToSource } - ${ entry.error }\n` );
				} else {
					typeDoc.logger.warn( entry.error, entry.symbol.declarations[ 0 ] );
				}
			} );

		typeDoc.logger.info( 'Validation completed.' );

		return !errors.size;
	}
};
