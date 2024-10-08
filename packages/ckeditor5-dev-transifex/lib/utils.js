/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import { logger as loggerFactory } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Checks whether specified `properties` are specified in the `objectToCheck` object.
 *
 * Throws an error if any property is missing.
 *
 * @param {object} objectToCheck
 * @param {Array.<string>} properties
 */
export function verifyProperties( objectToCheck, properties ) {
	const nonExistingProperties = properties.filter( property => objectToCheck[ property ] === undefined );

	if ( nonExistingProperties.length ) {
		throw new Error( `The specified object misses the following properties: ${ nonExistingProperties.join( ', ' ) }.` );
	}
}

/**
 * Creates logger instance.
 *
 * @returns {object} logger
 * @returns {Function} logger.progress
 * @returns {Function} logger.info
 * @returns {Function} logger.warning
 * @returns {Function} logger.error
 */
export function createLogger() {
	const logger = loggerFactory();

	return {
		progress( message ) {
			if ( !message ) {
				this.info( '' );
			} else {
				this.info( '\n📍 ' + chalk.cyan( message ) );
			}
		},
		...logger
	};
}
