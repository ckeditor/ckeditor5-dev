/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const gutil = require( 'gulp-util' );

const verbosity = {
	// Displays everything.
	info: 'info',

	// Displays warning and error logs.
	warning: 'warning',

	// Displays error logs only.
	error: 'error',
};

const levels = new Map();
levels.set( verbosity.info, new Set( [ verbosity.info ] ) );
levels.set( verbosity.warning, new Set( [ verbosity.info, verbosity.warning ] ) );
levels.set( verbosity.error, new Set( Object.keys( verbosity ).map( v => verbosity[ v ] ) ) );

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
		 * Displays a message when verbosity level is equal to `verbosity.info`.
		 *
		 * @param {String} message Message to log.
		 * @param {Object} options
		 * @param {Boolean} options.raw Whether to display non-modified message.
		 */
		info( message, options = { raw: false } ) {
			this._log( verbosity.info, message, options );
		},

		/**
		 * Displays a warning message when verbosity level is equal to `verbosity.info` or `verbosity.warning`.
		 *
		 * @param {String} message Message to log.
		 * @param {Object} options
		 * @param {Boolean} [options.raw=false] Whether to display non-modified message.
		 */
		warning( message, options = { raw: false } ) {
			this._log( verbosity.warning, gutil.colors.yellow( message ), options );
		},

		/**
		 * Displays a error message.
		 *
		 * @param {String} message Message to log.
		 * @param {Object} options
		 * @param {Boolean} [options.raw=false] Whether to display non-modified message.
		 */
		error( message, options = { raw: false } ) {
			this._log( verbosity.error, gutil.colors.red( message ), options );
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
