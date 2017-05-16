/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Plugin for Webpack which helps to inform the developer about processes.
 */
module.exports = class WebpackNotifierPlugin {
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

		compiler.plugin( 'done', stats => {
			if ( stats.compilation.errors.length ) {
				for ( const item of stats.compilation.errors ) {
					this.log.error( item.message, { raw: true } );
				}
			}

			if ( stats.compilation.warnings.length ) {
				for ( const item of stats.compilation.warnings ) {
					this.log.warning( item.message, { raw: true } );
				}
			}

			this.log.info( '[Webpack] Finished the compilation.' );
		} );
	}
};
