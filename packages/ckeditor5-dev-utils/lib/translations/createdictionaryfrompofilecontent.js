/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const PO = require( 'pofile' );

/**
 * Returns object with key-value pairs from parsed po file.
 *
 * @param {String} poFileContent Content of the translation file.
 * @returns {LocaleData} Locale data
 */
module.exports = function createDictionaryFromPoFileContent( poFileContent ) {
	const po = PO.parse( poFileContent );

	/** @type {LocaleData} */
	const localeData = {};

	for ( const item of po.items ) {
		let key = item.msgid.toLowerCase();
		if ( item.msgctxt ) {
			key = `${ item.msgctxt.toLowerCase() }|${ key }`;
		}

		/** @type {string | string[]} */
		let value = item.msgstr;
		if ( value.length == 1 ) {
			value = value[ 0 ];
		}

		localeData[ key ] = value;
	}

	const pluralForms = po.headers[ 'Plural-Forms' ];
	if ( pluralForms ) {
		localeData.PLURAL_FORMS = pluralForms;
	}

	return localeData;
};

/**
 * Locale data for a single language.
 *
 * This is a mapping from message key
 * to the translated message or array of messages in case of plural messages.
 *
 * Special `PLURAL_FORMS` key shall contain the plural forms expression for the given language.
 *
 * @typedef {Record<string, string | string[]>} LocaleData
 */
