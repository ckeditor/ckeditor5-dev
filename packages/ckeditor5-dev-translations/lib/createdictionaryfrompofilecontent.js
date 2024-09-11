/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import PO from 'pofile';

/**
 * Returns object with key-value pairs from parsed po file.
 *
 * @param {String} poFileContent Content of the translation file.
 * @returns {Object.<String,String[]>}
 */
export default function createDictionaryFromPoFileContent( poFileContent ) {
	const po = PO.parse( poFileContent );

	const keys = {};

	for ( const item of po.items ) {
		if ( item.msgstr[ 0 ] ) {
			// Return the whole msgstr array to collect the single form and all plural forms.
			keys[ item.msgid ] = item.msgstr;
		}
	}

	return keys;
}
