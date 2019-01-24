/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const translateSource = require( './translatesource' );
const path = require( 'path' );
const fs = require( 'fs' );
const createDictionaryFromPoFileContent = require( './createdictionaryfrompofilecontent' );
const { EventEmitter } = require( 'events' );

/**
 * `SingleLanguageTranslationService` replaces `t()` call strings with translated one directly in the build.
 */
module.exports = class SingleLanguageTranslationService extends EventEmitter {
	/**
	 * @param {String} language Target language.
	 */
	constructor( language ) {
		super();

		/**
		 * Main language that should be built in to the bundle.
		 *
		 * @private
		 */
		this._language = language;

		/**
		 * Set of handled packages that speeds up the translation process.
		 *
		 * @private
		 */
		this._handledPackages = new Set();

		/**
		 * translationKey -> targetTranslation dictionary.
		 *
		 * @private
		 */
		this._dictionary = {};
	}

	/**
	 * Translate file's source and replace `t()` call strings with translated strings.
	 *
	 * @fires error
	 * @fires warning
	 * @param {String} source Source of the file.
	 * @param {String} fileName File name.
	 * @returns {String}
	 */
	translateSource( source, fileName ) {
		const translate = originalString => this._translateString( originalString, fileName );
		const { output, errors } = translateSource( source, fileName, translate );

		for ( const error of errors ) {
			this.emit( 'error', error );
		}

		return output;
	}

	/**
	 * Loads package and tries to get the PO file from the package.
	 *
	 * @param {String} pathToPackage Path to the package containing translations.
	 */
	loadPackage( pathToPackage ) {
		if ( this._handledPackages.has( pathToPackage ) ) {
			return;
		}

		this._handledPackages.add( pathToPackage );

		const pathToTranslationDirectory = this._getPathToTranslationDirectory( pathToPackage, this._language );
		const pathToPoFile = pathToTranslationDirectory + path.sep + this._language + '.po';

		this._loadPoFile( pathToPoFile );
	}

	/**
	 * That class doesn't generate any asset.
	 *
	 * @returns {Array}
	 */
	getAssets() {
		return [];
	}

	/**
	 * Load translations from the PO file.
	 *
	 * @private
	 * @param {String} pathToPoFile Path to the target PO file.
	 */
	_loadPoFile( pathToPoFile ) {
		if ( !fs.existsSync( pathToPoFile ) ) {
			return;
		}

		const poFileContent = fs.readFileSync( pathToPoFile, 'utf-8' );
		const parsedTranslationFile = createDictionaryFromPoFileContent( poFileContent );

		for ( const translationKey in parsedTranslationFile ) {
			// TODO: ensure that translation files can't use the same translationKey.
			this._dictionary[ translationKey ] = parsedTranslationFile[ translationKey ];
		}
	}

	/**
	 * Translate original string for the target language.
	 *
	 * @private
	 * @param {String} originalString
	 * @param {String} sourceFile Path to the original string's file.
	 */
	_translateString( originalString, sourceFile ) {
		if ( !this._dictionary[ originalString ] ) {
			this.emit( 'warning', `Missing translation for '${ originalString }' for '${ this._language }' language in ${ sourceFile }.` );

			return originalString;
		}

		return this._dictionary[ originalString ];
	}

	/**
	 * Return path to the translation directory depending on the path to package.
	 * This method is protected to enable this class usage in other environments than CKE5.
	 *
	 * @protected
	 * @param {String} pathToPackage
	 * @returns {String}
	 */
	_getPathToTranslationDirectory( pathToPackage ) {
		return path.join( pathToPackage, 'lang', 'translations' );
	}
};
