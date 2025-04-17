/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Application, TypeScript } from 'typedoc';
import seeValidator from './see-validator/index.js';
import linkValidator from './link-validator/index.js';
import firesValidator from './fires-validator/index.js';
import moduleValidator from './module-validator/index.js';
import overloadsValidator from './overloads-validator/index.js';

/**
 * Validates the CKEditor 5 documentation.
 */
export default function( app: Application, options: ValidatorOptions = {} ): boolean {
	const validators = [
		seeValidator,
		linkValidator,
		firesValidator,
		moduleValidator
	];

	if ( options.enableOverloadValidator ) {
		validators.push( overloadsValidator );
	}

	app.logger.info( 'Starting validation...' );

	// The same error can be reported twice:
	//
	// 1. When processing types and events (comments are copied from a type to an event).
	// 2. When a parent class defines an invalid link, inherited members link to the invalid link too.
	const errors = new Map();

	validators.forEach( validator => validator( app, ( error, node ) => {
		errors.set( node, { error, node } );
	} ) );

	errors.forEach( ( { error, node } ) => app.logger.warn( error, node ) );

	app.logger.info( 'Validation completed.' );

	return !errors.size;
}

export type ValidatorOptions = {
	enableOverloadValidator?: boolean;
};

export type ValidatorErrorCallback = ( error: string, node: TypeScript.Declaration | null ) => void;

