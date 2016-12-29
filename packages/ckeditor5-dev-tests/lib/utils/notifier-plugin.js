/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Plugin for Webpack which helps to inform the developer about processes.
 */
module.exports = class NotifierPlugin {
	constructor() {
		this.log = logger();
	}

	/**
	 * Applies plugin to the Webpack.
	 * See: https://webpack.github.io/docs/plugins.html#the-compiler-instance
	 *
	 * @param {*} compiler
	 */
	apply( compiler ) {
		compiler.plugin( 'compile', () => {
			this.log.info( '[Webpack] Starting scripts compilation...' );
		} );

		compiler.plugin( 'done', ( stats ) => {
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
		} );
	}
};
