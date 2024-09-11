/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import javascriptStringify from 'javascript-stringify';

/**
 * Transforms specified configuration to a string that match to our code style.
 *
 * @param {Object} config
 * @returns {String}
 */
export default function getEditorConfig( config ) {
	if ( !config ) {
		return '{}';
	}

	return javascriptStringify( config, null, '\t' )
		// Indent all but the first line (so it can be easily concatenated with `config = ${ editorConfig }`).
		.replace( /\n/g, '\n\t' );
}
