/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { logger: loggerFactory } = require( '@ckeditor/ckeditor5-dev-utils' );

const utils = {
	/**
	 * Checks whether specified `properties` are specified in the `objectToCheck` object.
	 *
	 * Throws an error if any property is missing.
	 *
	 * @param {Object} objectToCheck
	 * @param {Array.<String>} properties
	 */
	verifyProperties( objectToCheck, properties ) {
		const nonExistingProperties = properties.filter( property => objectToCheck[ property ] === undefined );

		if ( nonExistingProperties.length ) {
			throw new Error( `The specified object misses the following properties: ${ nonExistingProperties.join( ', ' ) }.` );
		}
	},

	/**
	 * Creates logger instance.
	 *
	 * @returns {Object} logger
	 * @returns {Function} logger.progress
	 * @returns {Function} logger.info
	 * @returns {Function} logger.warning
	 * @returns {Function} logger.error
	 */
	createLogger() {
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
};

module.exports = utils;
