/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const parsePoFileContent = require( './parsepofilecontent' );

/**
 *
 */
module.exports = class TranslationService {
	/**
	 * @param {String} langauge Target language.
	 */
	constructor( language ) {
		this.language = language;
		this.packagePaths = new Set();
		this.dictionary = new Map();
	}

	/**
	 * @param {String} pathToPackage Path to the package containing translations.
	 */
	loadPackage( pathToPackage ) {
		if ( this.packagePaths.has( pathToPackage ) ) {
			return;
		}

		this.packagePaths.add( pathToPackage );

		const pathToPoFile = path.join( process.cwd(), 'packages', pathToPackage, 'lang', 'translations', this.language + '.po' );

		if ( !fs.existsSync( pathToPoFile ) ) {
			return;
		}

		const poFileContent = fs.readFileSync( pathToPoFile, 'utf-8' );
		const parsedTranslationFile = parsePoFileContent( poFileContent );

		for ( const translationKey in parsedTranslationFile ) {
			this.dictionary.set( translationKey, parsedTranslationFile[ translationKey ] );
		}
	}

	/**
	 * Translates all t() call found in source text to the target language.
	 *
	 * @param {String} source Source text which will be translated.
	 * @returns {String}
	 *
	 */
	translateString( originalString ) {
		let translation = this.dictionary.get( originalString );

		if ( !translation ) {
			console.error( `Missing translation for: ${ originalString }` );
			translation = originalString;
		}

		return translation;
	}
};
