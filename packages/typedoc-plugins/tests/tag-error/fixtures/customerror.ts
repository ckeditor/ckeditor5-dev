/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * An error statement occurring before the `@module` definition.
 *
 * @error customerror-before-module
 */

/**
 * An error statement occurring before the `@module` definition. See {@link ~CustomError} or
 * {@link module:fixtures/customerror~CustomError Custom label}. A text after.
 *
 * @error customerror-before-module-with-links
 */

/**
 * @module fixtures/customerror
 */

/**
 * An error statement occurring after the "@module" definition.
 *
 * @error customerror-after-module
 */

import Error from './error.js';

/**
 * An error statement occurring before the export keyword.
 *
 * @error customerror-before-export
 */

export default class CustomError extends Error {
	public static create( errorName: string ): CustomError {
		/**
		 * @error customerror-inside-method-no-text
		 */

		/**
		 * An error statement occurring inside a method.
		 *
		 * It contains a parameter.
		 *
		 * @error customerror-inside-method
		 * @param {string} test An example param.
		 * @customTag It's a custom tag that should not emit an error.
		 * @customTag {string} It's a custom tag that should not emit an error.
		 */
		return new CustomError( errorName );
	}
}

export function create( errorName: string ): CustomError {
	/**
	 * An error statement occurring inside a function.
	 *
	 * It contains parameters.
	 *
	 * @error customerror-inside-function
	 */
	return new CustomError( errorName );
}

/**
 * An error statement occurring after the export keyword.
 *
 * @error customerror-after-export
 */

/**
 * An error used for checking types in tests.
 *
 * @error customerror-parameters
 *
 * @param {boolean} intrinsicType A comment.
 * @param {string|number} unionType Description of the error.
 * @param {module:fixtures/error~Error} exampleModule Just an existing module.
 * @param {module:fixtures/error~ErrorFooBar} exampleMissingModule Just a non-existing module.
 * @param {module:fixtures/error~SystemError#customPropertyInInterface} exampleInterfaceChildren Just a named property.
 * @param {Array.<module:fixtures/error~SystemError>} arrayModule An array of modules.
 * @param {Array.<module:fixtures/error~SystemErrorFooBarHe>} arrayMissingModule An array of non-existing modules.
 * @param {Array.<string>} arrayString An array of strings.
 * @param {HTMLElement} domInstance An instance of an HTML element.
 * @param {object} nestedObject A nested object.
 * @param {any} linkInDescriptionAbsolute A name {@link module:utils/object~Object} `description`.
 * @param {any} linkInDescriptionRelative Description of the error. Please, see {@link ~CustomError}.
 * @param {any} paramMissingDescription
 * @param paramMissingType
 */
