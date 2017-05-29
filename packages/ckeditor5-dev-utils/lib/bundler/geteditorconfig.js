/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const javascriptStringify = require( 'javascript-stringify' );

/**
 * Transforms specified configuration to a string which can be inserted
 * to generated an entry file.
 *
 * Keys and values will be wrapped in apostrophes instead of quotation marks.
 *
 * Keys which contains letters or/and numbers or/and underscore or/and a Dollar sign
 * will not be wrapped in apostrophes.
 *
 * @param {Object} config
 * @returns {String}
 */
module.exports = function getEditorConfig( config ) {
	if ( !config ) {
		return '{}';
	}

	return javascriptStringify( config, null, '\t' )
		.split( '\n' )
		.map( ( line, index ) => {
			if ( index === 0 ) {
				return line;
			}

			return `\t${ line }`;
		} )
		.join( '\n' );
};
