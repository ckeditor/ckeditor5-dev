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

import Error from './error';

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
 * @param {HTMLElement} domInstance An instance of an HTML element.
 * @param {obj.value} nestedObject A nested object.
 * @param {any} linkInDescriptionAbsolute A name {@link module:utils/object~Object} `description`.
 * @param {any} linkInDescriptionRelative Description of the error. Please, see {@link ~CustomError}.
 * @param {any} paramMissingDescription
 * @param paramMissingType
 */
