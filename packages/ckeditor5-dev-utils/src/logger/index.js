/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';

const levels = new Map();

levels.set( 'silent', new Set( [] ) );
levels.set( 'info', new Set( [ 'info' ] ) );
levels.set( 'warning', new Set( [ 'info', 'warning' ] ) );
levels.set( 'error', new Set( [ 'info', 'warning', 'error' ] ) );

/**
 * Logger module which allows configuring the verbosity level.
 *
 * There are three levels of verbosity:
 * 1. `info` - all messages will be logged,
 * 2. `warning` - warning and errors will be logged,
 * 3. `error` - only errors will be logged.
 *
 * Usage:
 *
 *      import { logger } from '@ckeditor/ckeditor5-dev-utils';
 *
 *      const infoLog = logger( 'info' );
 *      infoLog.info( 'Message.' ); // This message will be always displayed.
 *      infoLog.warning( 'Message.' ); // This message will be always displayed.
 *      infoLog.error( 'Message.' ); // This message will be always displayed.
 *
 *      const warningLog = logger( 'warning' );
 *      warningLog.info( 'Message.' ); // This message won't be displayed.
 *      warningLog.warning( 'Message.' ); // This message will be always displayed.
 *      warningLog.error( 'Message.' ); // This message will be always displayed.
 *
 *      const errorLog = logger( 'error' );
 *      errorLog.info( 'Message.' ); // This message won't be displayed.
 *      errorLog.warning( 'Message.' ); // This message won't be displayed.
 *      errorLog.error( 'Message.' ); // This message will be always displayed.
 *
 * Additionally, the `logger#error()` method prints the error instance if provided as the second argument.
 *
 * @param {'info'|'warning'|'error'|'silent'} [moduleVerbosity='info'] Level of the verbosity for all log methods.
 * @returns {object} logger
 * @returns {Function} logger.info
 * @returns {Function} logger.warning
 * @returns {Function} logger.error
 */
export default function logger( moduleVerbosity = 'info' ) {
	return {
		/**
		 * Displays a message when verbosity level is equal to 'info'.
		 *
		 * @param {string} message Message to log.
		 */
		info( message ) {
			this._log( 'info', message );
		},

		/**
		 * Displays a warning message when verbosity level is equal to 'info' or 'warning'.
		 *
		 * @param {string} message Message to log.
		 */
		warning( message ) {
			this._log( 'warning', chalk.yellow( message ) );
		},

		/**
		 * Displays an error message.
		 *
		 * @param {string} message Message to log.
		 * @param {Error} [error] An error instance to log in the console.
		 */
		error( message, error ) {
			this._log( 'error', chalk.red( message ), error );
		},

		/**
		 * @private
		 * @param {string} messageVerbosity Verbosity of particular message.
		 * @param {string} message Message to log.
		 * @param {Error} [error] An error instance to log in the console.
		 */
		_log( messageVerbosity, message, error ) {
			if ( !levels.get( messageVerbosity ).has( moduleVerbosity ) ) {
				return;
			}

			console.log( message );

			if ( error ) {
				console.dir( error, { depth: null } );
			}
		}
	};
}
