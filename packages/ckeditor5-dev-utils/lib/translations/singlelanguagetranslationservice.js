/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const translateSource = require( './translateSource' );
const path = require( 'path' );
const fs = require( 'fs' );
const createDictionaryFromPoFileContent = require( './createdictionaryfrompofilecontent' );

/**
 * `SingleLanguageTranslationService` replaces `t()` call strings with translated one directly in the build
 */
module.exports = class SingleLanguageTranslationService {
	constructor( languages ) {
		/**
		 * @readonly
		 */
		this.dictionary = {};

		/**
		 * @readonly
		 */
		this.packagePaths = new Set();

		this.language = languages[ 0 ];
	}

	/**
	 * Translates file's source and replace `t()` call strings with translated strings.
	 *
	 * @param {String} source
	 */
	translateSource( source ) {
		return translateSource( source, originalString => this.translateString( originalString ) );
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

		const pathToPoFile = this._getPathToPoFile( pathToPackage, this.language );

		this._loadPoFile( pathToPoFile );
	}

	getAssets() {
		return [];
	}

	_loadPoFile( pathToPoFile ) {
		if ( !fs.existsSync( pathToPoFile ) ) {
			return;
		}

		const poFileContent = fs.readFileSync( pathToPoFile, 'utf-8' );
		const parsedTranslationFile = createDictionaryFromPoFileContent( poFileContent );

		for ( const translationKey in parsedTranslationFile ) {
			// TODO: ensure that translation files can't use the same translationKey.
			this.dictionary[ translationKey ] = parsedTranslationFile[ translationKey ];
		}
	}

	translateString( originalString ) {
		return this.dictionary[ originalString ];
	}

	/**
	 * @protected
	 */
	_getPathToPoFile( pathToPackage, languageCode ) {
		return path.join( pathToPackage, 'lang', 'translations', languageCode + '.po' );
	}
};
