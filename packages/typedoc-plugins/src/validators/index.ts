/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	type Context,
	type Application,
	type TypeScript
} from 'typedoc';
import { getPluginPriority } from '../utils/getpluginpriority.js';
import seeValidator from './see-validator/index.js';
import linkValidator from './link-validator/index.js';
import firesValidator from './fires-validator/index.js';
import moduleValidator from './module-validator/index.js';
import overloadsValidator from './overloads-validator/index.js';

/**
 * Validates the CKEditor 5 documentation.
 */
export function validate( app: Application, options: ValidatorOptions = {} ): void {
	app.converter.on( Converter.EVENT_END, ( context: Context ) => {
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

		validators.forEach( validator => {
			validator( context, ( error, node ) => {
				errors.set( node, { error, node } );
			} );
		} );

		errors.forEach( ( { error, node } ) => app.logger.warn( error, node ) );

		app.logger.info( 'Validation completed.' );

		if ( options.strict && errors.size ) {
			throw 'Found errors during the validation process.';
		}
	}, getPluginPriority( 'validators' ) );
}

export type ValidatorOptions = {
	enableOverloadValidator?: boolean;
	strict?: boolean;
};

export type ValidatorErrorCallbackArg = [ error: string, node: TypeScript.Declaration | null ];

export type ValidatorErrorCallback = ( ...args: ValidatorErrorCallbackArg ) => void;

