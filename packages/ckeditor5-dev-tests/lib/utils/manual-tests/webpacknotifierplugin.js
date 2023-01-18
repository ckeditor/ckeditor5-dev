/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Plugin for Webpack which helps to inform the developer about processes.
 */
module.exports = class WebpackNotifierPlugin {
	/**
	 * @param {Object} options
	 * @param {Function} options.onTestCompilationStatus
	 * @param {String} options.processName
	 */
	constructor( options ) {
		this.log = logger();
		this.onTestCompilationStatus = options.onTestCompilationStatus;
		this.processName = options.processName;
	}

	/**
	 * Applies plugin to the Webpack.
	 * See: https://webpack.github.io/docs/plugins.html#the-compiler-instance
	 *
	 * @param {*} compiler
	 */
	apply( compiler ) {
		compiler.hooks.compile.tap( this.constructor.name, () => {
			this.log.info( `[Webpack] Starting scripts compilation (${ this.processName })...` );
			this.onTestCompilationStatus( `start:${ this.processName }` );
		} );

		compiler.hooks.done.tap( this.constructor.name, stats => {
			if ( stats.compilation.errors.length ) {
				for ( const item of stats.compilation.errors ) {
					this.log.error( item.message );
				}
			}

			if ( stats.compilation.warnings.length ) {
				for ( const item of stats.compilation.warnings ) {
					this.log.warning( item.message );
				}
			}

			this.log.info( `[Webpack] Finished the compilation (${ this.processName }).` );

			if ( !stats.compilation.options.watch ) {
				this.log.info( `[Webpack] File watcher is disabled (${ this.processName }).` );
			}

			this.onTestCompilationStatus( `finished:${ this.processName }` );
		} );
	}
};
