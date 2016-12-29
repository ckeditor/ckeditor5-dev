/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { utils: compilerUtils } = require( '@ckeditor/ckeditor5-dev-compiler' );
const minimist = require( 'minimist' );

const utils = {
	/**
	 * @returns {Object} options
	 * @returns {Boolean} [options.dev=false] options.dev Whether a build is in development mode.
	 */
	parseArguments() {
		return minimist( process.argv.slice( 2 ), {
			boolean: [
				'dev'
			],
			default: {
				dev: false
			}
		} );
	},

	/**
	 * Returns an array with paths to documentation configs.
	 *
	 * @param {String} rootDir Root of main project repository.
	 * @returns {Array.<String>}
	 */
	getDocumentationConfigPaths( rootDir ) {
		return compilerUtils.getPackages( rootDir )
			.map( ( item ) => {
				return path.resolve( item, 'docs', 'config.json' );
			} );
	}
};

module.exports = utils;
