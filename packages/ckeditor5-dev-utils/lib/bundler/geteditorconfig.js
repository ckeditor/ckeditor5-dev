/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * @param {Object} config
 * @returns {String}
 */
module.exports = function getEditorConfig( config ) {
	if ( !config ) {
		return '{}';
	}

	return JSON.stringify( config, null, '\t' )
		.split( '\n' )
		.map( ( line, index ) => {
			if ( index === 0 ) {
				return line;
			}

			return `\t${ line }`;
		} )
		.join( '\n' )
		.replace( /"/g, '\'' )
		.replace( /'([A-Z0-9_]+)':/gi, '$1:' );
};
