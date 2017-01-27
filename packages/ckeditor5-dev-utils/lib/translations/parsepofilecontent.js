/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const gettextParser = require( 'gettext-parser' );

module.exports = function parsePoFileContent( poFileContent ) {
	const parsedContent = gettextParser.po.parse( poFileContent );

	return getCorrectTranslationFormat( parsedContent.translations );
};

// Fixes weird gettextParser output.
function getCorrectTranslationFormat( translations ) {
	const result = {};

	Object.keys( translations )
		.filter( key => !!key )
		.map( ( key ) => translations[key] )
		.map( ( obj ) => obj[ Object.keys( obj )[0] ] )
		.forEach( ( obj ) => result[ obj.msgid ] = obj.msgstr[0] );

	return result;
}
