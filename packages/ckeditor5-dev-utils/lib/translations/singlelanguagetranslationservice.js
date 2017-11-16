/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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

		this._language = language;

		this._packagePaths = new Set();

		this._dictionary = {};
	}

	/**
	 * Translate file's source and replace `t()` call strings with translated strings.
	 *
	 * @fires error
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
	 * Loads package and tries to get the po file from the package.
	 *
	 * @param {String} pathToPackage Path to the package containing translations.
	 */
	loadPackage( pathToPackage ) {
		if ( this._packagePaths.has( pathToPackage ) ) {
			return;
		}

		this._packagePaths.add( pathToPackage );

		const pathToPoFile = this._getPathToPoFile( pathToPackage, this._language );

		this._loadPoFile( pathToPoFile );
	}

	/**
	 * That class doesn't generate any asset.
	 */
	getAssets() {
		return [];
	}

	// Load translations from the PO file.
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

	_translateString( originalString, sourceFile ) {
		if ( !this._dictionary[ originalString ] ) {
			this.emit( 'error', `Missing translation for '${ originalString }' for ${ this._language } language in ${ sourceFile }.` );

			return originalString;
		}

		return this._dictionary[ originalString ];
	}

	/**
	 * @protected
	 */
	_getPathToPoFile( pathToPackage, languageCode ) {
		return path.join( pathToPackage, 'lang', 'translations', languageCode + '.po' );
	}
};
