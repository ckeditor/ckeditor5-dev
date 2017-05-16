/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * @see http://usejsdoc.org/about-plugins.html
 */

const DocletValidator = require( './doclet-validator' );

exports.handlers = {
	parseComplete( e ) {
		const validator = new DocletValidator( e.doclets );

		const errors = validator.findErrors();

		// Prints only first 50 errors to stdout.
		printErrors( errors, 50 );
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
		errorMessages.push( `\tat ${ error.file } (line ${ error.line })\n` );
	}

	errorMessages.push( '\nValidation Summary:' );
	errorMessages.push( ` * Validator found ${ errors.length } errors.` );

	if ( errors.length > maxSize ) {
		errorMessages.push( ` * ${ errors.length - maxSize } errors not shown in the console.` );
	}

	process.stderr.write( errorMessages.join( '\n' ) );
}
