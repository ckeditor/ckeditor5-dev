/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { logger } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Plugin for Webpack which helps to inform the developer about processes.
 */
export default class WebpackNotifierPlugin {
	/**
	 * @param {object} options
	 * @param {function} options.onTestCompilationStatus
	 */
	constructor( options ) {
		this.log = logger();
		this.onTestCompilationStatus = options.onTestCompilationStatus;
	}

	/**
	 * Applies plugin to the Webpack.
	 * See: https://webpack.github.io/docs/plugins.html#the-compiler-instance
	 *
	 * @param {*} compiler
	 */
	apply( compiler ) {
		compiler.hooks.compile.tap( this.constructor.name, () => {
			this.log.info( '[Webpack] Starting scripts compilation...' );
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

			this.log.info( '[Webpack] Finished the compilation.' );

			if ( !stats.compilation.options.watch ) {
				this.log.info( '[Webpack] File watcher is disabled.' );
			}

			this.onTestCompilationStatus( `finished:${ this.processName }` );
		} );
	}
}
