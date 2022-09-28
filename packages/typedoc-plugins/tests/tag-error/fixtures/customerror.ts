/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
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
 *
 * @param {Number} exampleNumber Number description.
 * @param {String} exampleString String `description`.
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
		 * An error statement occurring inside a method.
		 *
		 * It contains a parameter.
		 *
		 * @error customerror-inside-method
		 *
		 * @param {String} errorName Description of the error. Please, see {@link ~CustomError} or
		 * @param {module:utils/object~Object} exampleModule Just a module.
		 * @param exampleObject A name {@link module:utils/object~Object} `description`.
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
	 *
	 * @param {String} errorName Description of the error.
	 * @param {Object} priority The priority of this error.
	 * @param {Number} priority.value A raw value of the priority.
	 */
	return new CustomError( errorName );
}

/**
 * An error statement occurring after the export keyword.
 *
 * @error customerror-after-export
 */
