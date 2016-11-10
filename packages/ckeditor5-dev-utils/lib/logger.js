/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const gutil = require( 'gulp-util' );
const levels = new Map();

// Displays everything.
levels.set( 'info', new Set( [ 'info' ] ) );

// Displays warning and error logs.
levels.set( 'warning', new Set( [ 'info', 'warning' ] ) );

// Displays error logs only.
levels.set( 'error', new Set( [ 'info', 'warning', 'error' ] ) );

/**
 * See: https://github.com/ckeditor/ckeditor5-dev-utils/issues/27
 *
 * @param {String} moduleVerbosity Level of the verbosity for all log methods.
 * @returns {Object} logger
 * @returns {Function} logger.info
 * @returns {Function} logger.warning
 * @returns {Function} logger.error
 */
module.exports = ( moduleVerbosity ) => {
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
			this._log( 'warning', gutil.colors.yellow( message ), options );
		},

		/**
		 * Displays a error message.
		 *
		 * @param {String} message Message to log.
		 * @param {Object} options
		 * @param {Boolean} [options.raw=false] Whether to display non-modified message.
		 */
		error( message, options = { raw: false } ) {
			this._log( 'error', gutil.colors.red( message ), options );
		},

		/**
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
