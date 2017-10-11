/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const gutil = require( 'gulp-util' );
const chalk = require( 'chalk' );
const levels = new Map();

// Displays everything.
levels.set( 'info', new Set( [ 'info' ] ) );

// Displays warning and error logs.
levels.set( 'warning', new Set( [ 'info', 'warning' ] ) );

// Displays error logs only.
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
 *      const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger;
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
 * @param {String} moduleVerbosity='info' Level of the verbosity for all log methods.
 * @returns {Object} logger
 * @returns {Function} logger.info
 * @returns {Function} logger.warning
 * @returns {Function} logger.error
 */
module.exports = ( moduleVerbosity = 'info' ) => {
	return {
		/**
		 * Displays a message when verbosity level is equal to 'info'.
		 *
		 * @param {String} message Message to log.
		 * @param {Object} options
		 * @param {Boolean} options.raw Whether to display non-modified message.
		 */
		info( message, options = { raw: false } ) {
			this._log( 'info', message, options );
		},

		/**
		 * Displays a warning message when verbosity level is equal to 'info' or 'warning'.
		 *
		 * @param {String} message Message to log.
		 * @param {Object} options
		 * @param {Boolean} [options.raw=false] Whether to display non-modified message.
		 */
		warning( message, options = { raw: false } ) {
			this._log( 'warning', chalk.yellow( message ), options );
		},

		/**
		 * Displays an error message.
		 *
		 * @param {String} message Message to log.
		 * @param {Object} options
		 * @param {Boolean} [options.raw=false] Whether to display non-modified message.
		 */
		error( message, options = { raw: false } ) {
			this._log( 'error', chalk.red( message ), options );
		},

		/**
		 * @private
		 * @param {String} messageVerbosity Verbosity of particular message.
		 * @param {String} message Message to log.
		 * @param {Object} options
		 * @param {Boolean} [options.raw=false] Whether to display non-modified message.
		 */
		_log( messageVerbosity, message, options ) {
			if ( !levels.get( messageVerbosity ).has( moduleVerbosity ) ) {
				return;
			}

			if ( options.raw ) {
				console.log( message );
			} else {
				gutil.log( message );
			}
		}
	};
};
