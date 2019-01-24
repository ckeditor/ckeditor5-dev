/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const createDictionaryFromPoFileContent = require( './createdictionaryfrompofilecontent' );
const translateSource = require( './translatesource' );
const ShortIdGenerator = require( './shortidgenerator' );
const { EventEmitter } = require( 'events' );

/**
 * `MultipleLanguageTranslationService` replaces `t()` call params with short ids
 * and provides language assets that can translate those ids to the target languages.
 *
 * `translationKey` - original english string that occur in `t()` call params.
 */
module.exports = class MultipleLanguageTranslationService extends EventEmitter {
	/**
	 * @param {String} language Main language.
	 * @param {Object} options
	 * @param {Boolean} [options.compileAllLanguages=false] Flag indicates whether the languages are specified
	 * or should be found at runtime.
	 * @param {Array.<String>} options.additionalLanguages Additional languages which files will be emitted.
	 * When option is set to 'all', all languages found during the compilation will be added.
	 */
	constructor( language, { additionalLanguages, compileAllLanguages = false } = {} ) {
		super();

		/**
		 * Main language that should be built in to the bundle.
		 *
		 * @private
		 */
		this._mainLanguage = language;

		/**
		 * Set of languages that will be used by translator. This set might be expanded by found languages,
		 * if `compileAllLanguages` is turned on.
		 *
		 * @private
		 */
		this._languages = new Set( [ language, ...additionalLanguages ] );

		/**
		 * Option indicates whether the languages are specified or should be found at runtime.
		 *
		 * @private
		 */
		this._compileAllLanguages = compileAllLanguages;

		/**
		 * Set of handled packages that speeds up the translation process.
		 *
		 * @private
		 */
		this._handledPackages = new Set();

		/**
		 * language -> translationKey -> targetTranslation dictionary.
		 *
		 * @private
		 */
		this._dictionary = {};

		/**
		 * translationKey -> id dictionary gathered from files parsed by loader.
		 *
		 * @private
		 * @type {Object.<String,Object>}
		 */
		this._translationIdsDictionary = {};

		/**
		 * Id generator that's used to replace translation strings with short ids and generate translation files.
		 *
		 * @private
		 */
		this._idGenerator = new ShortIdGenerator();
	}

	/**
	 * Translate file's source and replace `t()` call strings with short ids.
	 * Fire an error when the acorn parser face a trouble.
	 *
	 * @fires error
	 * @param {String} source Source of the file.
	 * @param {String} fileName File name.
	 * @returns {String}
	 */
	translateSource( source, fileName ) {
		const translate = originalString => this._getId( originalString );
		const { output, errors } = translateSource( source, fileName, translate );

		for ( const error of errors ) {
			this.emit( 'error', error );
		}

		return output;
	}

	/**
	 * Load package and tries to get PO files from the package if it's unknown.
	 * If the `compileAllLanguages` flag is set to true, language's set will be expanded by the found languages.
	 *
	 * @fires warning
	 * @param {String} pathToPackage Path to the package containing translations.
	 */
	loadPackage( pathToPackage ) {
		if ( this._handledPackages.has( pathToPackage ) ) {
			return;
		}

		this._handledPackages.add( pathToPackage );

		const pathToTranslationDirectory = this._getPathToTranslationDirectory( pathToPackage );

		if ( !fs.existsSync( pathToTranslationDirectory ) ) {
			return;
		}

		if ( this._compileAllLanguages ) {
			for ( const fileName of fs.readdirSync( pathToTranslationDirectory ) ) {
				if ( !fileName.endsWith( '.po' ) ) {
					this.emit(
						'warning',
						`Translation directory (${ pathToTranslationDirectory }) should contain only translation files.`
					);

					continue;
				}

				const language = fileName.replace( /\.po$/, '' );
				const pathToPoFile = path.join( pathToTranslationDirectory, fileName );

				this._languages.add( language );
				this._loadPoFile( language, pathToPoFile );
			}

			return;
		}

		for ( const language of this._languages ) {
			const pathToPoFile = path.join( pathToTranslationDirectory, language + '.po' );

			this._loadPoFile( language, pathToPoFile );
		}
	}

	/**
	 * Return an array of assets based on the stored dictionaries.
	 * If there is one `compilationAssets`, merge main translation with that asset and join with other assets built outside.
	 * Otherwise fire an warning and return an array of assets built outside of the `compilationAssets`.
	 *
	 * @fires warning
	 * @fires error
	 * @param {Object} options
	 * @param {String} options.outputDirectory Output directory for the translation files relative to the output.
	 * @param {Object} options.compilationAssets Original assets from the compiler (e.g. Webpack).
	 * @returns {Array.<Object>}
	 */
	getAssets( { outputDirectory, compilationAssets } ) {
		const compilationAssetNames = Object.keys( compilationAssets )
			.filter( name => name.endsWith( '.js' ) );

		if ( compilationAssetNames.length == 0 ) {
			return [];
		}

		if ( compilationAssetNames.length > 1 ) {
			this.emit( 'warning', [
				'Because of the many found bundles, none of the bundles will contain the main language.',
				`You should add it directly to the application from the '${ outputDirectory }${ path.sep }${ this._mainLanguage }.js'.`
			].join( '\n' ) );

			return this._getTranslationAssets( outputDirectory, this._languages );
		}

		const mainAssetName = compilationAssetNames[ 0 ];

		const mainTranslationAsset = this._getTranslationAssets( outputDirectory, [ this._mainLanguage ] )[ 0 ];

		const mergedCompilationAsset = {
			outputBody: mainTranslationAsset.outputBody,
			outputPath: mainAssetName,
			shouldConcat: true
		};

		const otherLanguages = Array.from( this._languages )
			.filter( lang => lang !== this._mainLanguage );

		return [
			mergedCompilationAsset,
			...this._getTranslationAssets( outputDirectory, otherLanguages )
		];
	}

	/**
	 * Return assets for the given directory and languages.
	 *
	 * @private
	 * @param outputDirectory Output directory for assets.
	 * @param {Iterable.<String>} languages Languages for assets.
	 */
	_getTranslationAssets( outputDirectory, languages ) {
		return Array.from( languages ).map( language => {
			const translatedStrings = this._getIdToTranslatedStringDictionary( language );

			const outputPath = path.join( outputDirectory, `${ language }.js` );

			// Stringify translations and remove unnecessary `""` around property names.
			const stringifiedTranslations = JSON.stringify( translatedStrings )
				.replace( /"([a-z]+)":/g, '$1:' );

			const outputBody = (
				// We need to ensure that the CKEDITOR_TRANSLATIONS variable exists and if it exists, we need to extend it.
				// Use ES5 because this bit will not be transpiled!
				'(function(d){' +
					`d['${ language }']=Object.assign(` +
						`d['${ language }']||{},` +
						`${ stringifiedTranslations }` +
					')' +
				'})(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
			);

			return { outputBody, outputPath };
		} );
	}

	/**
	 * Walk through the `translationIdsDictionary` and find corresponding strings in the target language's dictionary.
	 * Use original strings if translated ones are missing.
	 *
	 * @private
	 * @param {String} lang Target language.
	 * @returns {Object.<String,String>}
	 */
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
				this.emit( 'warning', `Missing translation for '${ originalString }' for '${ lang }' language.` );
			}

			translatedStrings[ id ] = translatedString || originalString;
		}

		return translatedStrings;
	}

	/**
	 * Load translations from the PO files.
	 *
	 * @private
	 * @param {String} language PO file's language.
	 * @param {String} pathToPoFile Path to the target PO file.
	 */
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
			dictionary[ translationKey ] = parsedTranslationFile[ translationKey ];
		}
	}

	/**
	 * Return an id for the original string. If it's stored in the `_translationIdsDictionary` return it instead of generating new one.
	 *
	 * @private
	 * @param {String} originalString
	 * @returns {String}
	 */
	_getId( originalString ) {
		let id = this._translationIdsDictionary[ originalString ];

		if ( !id ) {
			id = this._idGenerator.getNextId();
			this._translationIdsDictionary[ originalString ] = id;
		}

		return id;
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
