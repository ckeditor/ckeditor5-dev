/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const replaceTCalls = require( './replacetcalls' );

module.exports = class CKEditorWebpackPlugin {
	/**
	 * @param {Object} [options]
	 * @param {Array.<String>} [options.packages] Array of directories in which packages will be looked for.
	 * @param {Array.<String>} [options.languages] Array of languages.
	 */
	constructor( options = {} ) {
		this.options = options;
	}

	apply( compiler ) {
		const { languages } = this.options;

		if ( languages && languages.length == 1 ) {
			replaceTCalls( compiler, languages[ 0 ] );
		} else {
			throw new Error( 'Multi-language support is not implemented yet.' );
		}
	}
};
