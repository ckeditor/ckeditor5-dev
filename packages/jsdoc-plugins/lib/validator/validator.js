/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * @see http://usejsdoc.org/about-plugins.html
 */

const DocletValidator = require( './doclet-validator' );
const logger = require( 'jsdoc/util/logger' );

exports.handlers = {
	processingComplete( e ) {
		const isValidateOnly = Boolean( process.env.JSDOC_VALIDATE_ONLY );
		const isStrictCheck = Boolean( process.env.JSDOC_STRICT_CHECK );

		const validator = new DocletValidator( e.doclets );
		const errors = validator.validate();

		// Prints only first 50 errors to stdout.
		printErrors( errors, 50 );

		// Mark the process as ended with error.
		if ( errors.length ) {
			process.exitCode = 1;

			if ( isValidateOnly || isStrictCheck ) {
				return logger.fatal( 'Since the process is being executed in strict or checking mode, aborting due to errors.' );
			}
		}

		if ( isValidateOnly ) {
			process.exit();
		}
	}
};

function printErrors( errors, maxSize ) {
	const errorMessages = [];

	if ( errors.length === 0 ) {
		process.stdout.write( 'No errors found during the validation.' );

		return;
	}

	for ( const error of errors.slice( 0, maxSize ) ) {
		errorMessages.push( error.message );
		errorMessages.push( `\tat ${ error.file }:${ error.line }\n` );
	}

	errorMessages.push( '\nValidation Summary:' );
	errorMessages.push( `* Validator found ${ errors.length } errors.\n` );

	if ( errors.length > maxSize ) {
		errorMessages.push( `* ${ errors.length - maxSize } errors not shown in the console.` );
	}

	process.stderr.write( errorMessages.join( '\n' ) );
}
