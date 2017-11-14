/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const createDictionaryFromPoFileContent = require( './createdictionaryfrompofilecontent' );
const translateSource = require( './translateSource' );
const ShortIdGenerator = require( './shortidgenerator' );

/**
 * `MultipleLanguageTranslationService` replaces `t()` call params with short ids
 * and provides assets that translate those ids to target languages.
 */
module.exports = class MultipleLanguageTranslationService {
	/**
	 * @param {String} language Target language.
	 */
	constructor( languages ) {
		/**
		 * @readonly
		 */
		this.languages = languages;

		/**
		 * @readonly
		 */
		this.packagePaths = new Set();

		/**
		 * @readonly
		 */
		this.dictionary = {};

		/**
		 * Original string -> hash dictionary gathered from files parsed by loader.
		 *
		 * @type {Object.<String,Object>}
		 * @readonly
		 */
		this.translationIdsDictionary = {};

		this._idCreator = new ShortIdGenerator();
	}

	/**
	 * Translates file's source and replace `t()` call strings with short ids.
	 *
	 * @param {String} source
	 */
	translateSource( source ) {
		return translateSource( source, originalString => this._getId( originalString ) );
	}

	/**
	 * Loads package and tries to get the po file from the package.
	 *
	 * @param {String} pathToPackage Path to the package containing translations.
	 */
	loadPackage( pathToPackage ) {
		if ( this.packagePaths.has( pathToPackage ) ) {
			return;
		}

		this.packagePaths.add( pathToPackage );

		for ( const language of this.languages ) {
			const pathToPoFile = this._getPathToPoFile( pathToPackage, language );

			this._loadPoFile( language, pathToPoFile );
		}
	}

	/**
	 * Returns an array of assets based on the stored dictionaries
	 *
	 * @param {Object} param0
	 * @param {String} [param0.outputDirectory]
	 * @returns {Array.<Object>}
	 */
	getAssets( { outputDirectory = 'lang' } ) {
		return this.languages.map( language => {
			const { translatedStrings, errors } = this._getIdToTranslatedStringDictionary( language );

			// TODO: Windows paths.
			const outputPath = path.join( outputDirectory, `${ language }.js` );
			const stringifiedTranslations = JSON.stringify( translatedStrings, null, 2 );
			const outputBody = `CKEDITOR_TRANSLATIONS.add( '${ language }', ${ stringifiedTranslations } )`;

			return { outputPath, outputBody, errors };
		} );
	}

	// Walk through the `translationIdsDictionary` and find corresponding strings in target language's dictionary.
	// Use original strings if translated ones are missing.
	_getIdToTranslatedStringDictionary( lang ) {
		const langDictionary = this.dictionary[ lang ];
		const translatedStrings = {};
		const errors = [];

		for ( const originalString in this.translationIdsDictionary ) {
			const id = this.translationIdsDictionary[ originalString ];
			const translatedString = langDictionary[ originalString ];

			if ( !translatedString ) {
				errors.push( `Missing translation for ${ originalString } for ${ lang } language.` );
			}

			translatedStrings[ id ] = translatedString || originalString;
		}

		return {
			translatedStrings,
			errors
		};
	}

	// Loads translations from the po file.
	_loadPoFile( language, pathToPoFile ) {
		if ( !fs.existsSync( pathToPoFile ) ) {
			return;
		}

		const poFileContent = fs.readFileSync( pathToPoFile, 'utf-8' );
		const parsedTranslationFile = createDictionaryFromPoFileContent( poFileContent );

		if ( !this.dictionary[ language ] ) {
			this.dictionary[ language ] = {};
		}

		const dictionary = this.dictionary[ language ];

		for ( const translationKey in parsedTranslationFile ) {
			// TODO: ensure that translation files can't use the same translationKey.
			dictionary[ translationKey ] = parsedTranslationFile[ translationKey ];
		}
	}

	// Translates all t() call found in source text to the target language.
	_getId( originalString ) {
		// TODO - log when translation is missing.

		let id = this.translationIdsDictionary[ originalString ];

		if ( !id ) {
			id = this._idCreator.getNextId();
			this.translationIdsDictionary[ originalString ] = id;
		}

		return id;
	}

	/**
	 * @protected
	 */
	_getPathToPoFile( pathToPackage, languageCode ) {
		return path.join( pathToPackage, 'lang', 'translations', languageCode + '.po' );
	}
};
