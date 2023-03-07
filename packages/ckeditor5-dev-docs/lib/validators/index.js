/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { utils } = require( '@ckeditor/typedoc-plugins' );
const seeValidator = require( './see-validator' );
const linkValidator = require( './link-validator' );
const firesValidator = require( './fires-validator' );
const moduleValidator = require( './module-validator' );
const overloadsValidator = require( './overloads-validator' );

/**
 * Validates the CKEditor 5 documentation.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Object} typeDoc A TypeDoc application instance.
 * @param {TypedocValidator} [options={}] A configuration object.
 * @returns {Boolean}
 */
module.exports = {
	validate( project, typeDoc, options = {} ) {
		const validators = [
			seeValidator,
			linkValidator,
			firesValidator,
			moduleValidator
		];

		if ( options.enableOverloadValidator ) {
			validators.push( overloadsValidator );
		}

		typeDoc.logger.info( 'Starting validation...' );

		// The same error can be reported twice:
		//
		// 1. When processing types and events (comments are copied from a type to an event).
		// 2. When a parent class defines an invalid link, inherited members link to the invalid link too.
		const errors = new Map();

		for ( const validator of validators ) {
			validator( project, ( error, reflection ) => {
				const node = utils.getNode( reflection );

				errors.set( node, { error, node } );
			} );
		}

		errors.forEach( ( { error, node } ) => typeDoc.logger.warn( error, node ) );

		typeDoc.logger.info( 'Validation completed.' );

		return !errors.size;
	}
};
