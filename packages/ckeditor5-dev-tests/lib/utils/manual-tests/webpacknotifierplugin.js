/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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
	 * See: https://webpack.js.org/contribute/writing-a-plugin/
	 *
	 * @param {*} compiler
	 */
	apply( compiler ) {
		compiler.hooks.compile.tap( this.constructor.name, () => {
			this.log.info( '[Webpack] Starting scripts compilation...' );
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
		} );
	}
};
