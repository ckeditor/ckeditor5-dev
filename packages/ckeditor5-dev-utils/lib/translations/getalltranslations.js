/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const parsePoFileContent = require( './parsepofilecontent' );

module.exports = function getAllTranslations( packageNames, language ) {
	const dictionary = new Map();

	for ( const packageName of packageNames ) {
		const pathToPackage = path.join( process.cwd(), 'node_modules', '@ckeditor', packageName );
		const pathToPoFile = path.join( pathToPackage, 'lang', 'translations', language + '.po' );

		if ( fs.existsSync( pathToPoFile ) ) {
			const poFileContent = fs.readFileSync( pathToPoFile, 'utf-8' );
			const parsedTranslationFile = parsePoFileContent( poFileContent );

			for ( const translationKey in parsedTranslationFile ) {
				dictionary.set( translationKey, parsedTranslationFile[ translationKey ] || translationKey );
			}
		}
	}

	return dictionary;
};
