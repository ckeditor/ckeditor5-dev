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
const { EventEmitter } = require( 'events' );

/**
 * `MultipleLanguageTranslationService` replaces `t()` call params with short ids
 * and provides assets that translate those ids to target languages.
 *
 * translationKey - original english string that occur in `t()` call params.
 */
module.exports = class MultipleLanguageTranslationService extends EventEmitter {
	/**
	 * @param {Array.<String>} languages Target languages.
	 */
	constructor( languages ) {
		super();

		this._languages = languages;

		this._packagePaths = new Set();

		// language -> translationKey -> targetTranslation dictionary.
		this._dictionary = {};

		// translationKey -> id dictionary gathered from files parsed by loader.
		// @type {Object.<String,Object>}
		this._translationIdsDictionary = {};

		this._idCreator = new ShortIdGenerator();
	}

	/**
	 * Translate file's source and replace `t()` call strings with short ids.
	 *
	 * @fires error
	 * @param {String} source
	 * @returns {String}
	 */
	translateSource( source ) {
		const { output, errors } = translateSource( source, originalString => this._translateString( originalString ) );

		for ( const error of errors ) {
			this.emit( 'error', error );
		}

		return output;
	}

	/**
	 * Load package and tries to get the po file from the package.
	 *
	 * @param {String} pathToPackage Path to the package containing translations.
	 */
	loadPackage( pathToPackage ) {
		if ( this._packagePaths.has( pathToPackage ) ) {
			return;
		}

		this._packagePaths.add( pathToPackage );

		for ( const language of this._languages ) {
			const pathToPoFile = this._getPathToPoFile( pathToPackage, language );

			this._loadPoFile( language, pathToPoFile );
		}
	}

	/**
	 * Return an array of assets based on the stored dictionaries.
	 *
	 * @fires error
	 * @param {Object} param0
	 * @param {String} [param0.outputDirectory]
	 * @returns {Array.<Object>}
	 */
	getAssets( { outputDirectory = 'lang' } ) {
		return this._languages.map( language => {
			const translatedStrings = this._getIdToTranslatedStringDictionary( language );

			const outputPath = path.join( outputDirectory, `${ language }.js` );
			const stringifiedTranslations = JSON.stringify( translatedStrings )
				.replace( /"([a-z]+)":/g, '$1:' ); // removes unnecessary `""` around property names.

			const outputBody = `CKEDITOR_TRANSLATIONS.add('${ language }',${ stringifiedTranslations })`;

			return { outputPath, outputBody };
		} );
	}

	// Walk through the `translationIdsDictionary` and find corresponding strings in the target language's dictionary.
	// Use original strings if translated ones are missing.
	_getIdToTranslatedStringDictionary( lang ) {
		let langDictionary = this._dictionary[ lang ];

		if ( !langDictionary ) {
			this.emit( 'error', `No translation found for ${ lang } language.` );

			// Fallback to the original translation strings.
			langDictionary = {};
		}

		const translatedStrings = {};

		for ( const originalString in this._translationIdsDictionary ) {
			const id = this._translationIdsDictionary[ originalString ];
			const translatedString = langDictionary[ originalString ];

			if ( !translatedString ) {
				this.emit( 'error', `Missing translation for ${ originalString } for ${ lang } language.` );
			}

			translatedStrings[ id ] = translatedString || originalString;
		}

		return translatedStrings;
	}

	// Load translations from the PO files.
	_loadPoFile( language, pathToPoFile ) {
		if ( !fs.existsSync( pathToPoFile ) ) {
			return;
		}

		const poFileContent = fs.readFileSync( pathToPoFile, 'utf-8' );
		const parsedTranslationFile = createDictionaryFromPoFileContent( poFileContent );

		if ( !this._dictionary[ language ] ) {
			this._dictionary[ language ] = {};
		}

		const dictionary = this._dictionary[ language ];

		for ( const translationKey in parsedTranslationFile ) {
			// TODO: ensure that translation files can't use the same translationKey.
			dictionary[ translationKey ] = parsedTranslationFile[ translationKey ];
		}
	}

	// Translate all t() call found in source text to the target language.
	_getId( originalString ) {
		// TODO - log when translation is missing.

		let id = this._translationIdsDictionary[ originalString ];

		if ( !id ) {
			id = this._idCreator.getNextId();
			this._translationIdsDictionary[ originalString ] = id;
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
