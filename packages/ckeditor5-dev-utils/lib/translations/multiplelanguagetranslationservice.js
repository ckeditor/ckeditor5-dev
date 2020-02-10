/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const createDictionaryFromPoFileContent = require( './createdictionaryfrompofilecontent' );
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
	 * @param {Array.<String>} [options.additionalLanguages] Additional languages which files will be emitted.
	 * When option is set to 'all', all languages found during the compilation will be added.
	 */
	constructor( language, { additionalLanguages = [], compileAllLanguages = false } = {} ) {
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
		 * @type {Set<string>}
		 */
		this._handledPackages = new Set();

		/**
		 * Dictionary of all the LocaleData per language.
		 * @private
		 * @type {Record<String, import('./createdictionaryfrompofilecontent').LocaleData>}
		 */
		this._localeData = {};
	}

	/**
	 * @param {String} source Source of the file.
	 * @returns {String}
	 */
	translateSource( source ) {
		return source;
	}

	/**
	 * Load package and tries to get PO files from the package if it's unknown.
	 * If the `compileAllLanguages` flag is set to true, language's set will be expanded by the found languages.
	 *
	 * @fires warning
	 * @param {String} packagePath Path to the package containing translations.
	 */
	loadPackage( packagePath ) {
		if ( this._handledPackages.has( packagePath ) ) {
			return;
		}

		this._handledPackages.add( packagePath );

		const localeDirPath = this._getLocaleDirPath( packagePath );
		if ( !fs.existsSync( localeDirPath ) ) {
			return;
		}

		if ( this._compileAllLanguages ) {
			for ( const fileName of fs.readdirSync( localeDirPath ) ) {
				const fileNameMatch = fileName.match( /^(.*)\.po$/iu );
				if ( fileNameMatch == null ) {
					this.emit(
						'warning',
						`Locale directory (${ localeDirPath }) should contain only translation files.`
					);

					continue;
				}

				const [ , language ] = fileNameMatch;
				const localeFilePath = path.join( localeDirPath, fileName );
				this._languages.add( language );
				this._loadLocaleFile( language, localeFilePath );
			}
		}
		else {
			for ( const language of this._languages ) {
				const localeFilePath = path.join( localeDirPath, language + '.po' );
				this._loadLocaleFile( language, localeFilePath );
			}
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

			return this._getLocaleAssets( outputDirectory, this._languages );
		}

		const mainAssetName = compilationAssetNames[ 0 ];

		const mainLocaleAsset = this._getLocaleAssets( outputDirectory, [ this._mainLanguage ] )[ 0 ];

		const mergedCompilationAsset = {
			outputBody: mainLocaleAsset.outputBody,
			outputPath: mainAssetName,
			shouldConcat: true
		};

		const otherLanguages = Array.from( this._languages )
			.filter( lang => lang !== this._mainLanguage );

		return [
			mergedCompilationAsset,
			...this._getLocaleAssets( outputDirectory, otherLanguages )
		];
	}

	/**
	 * Return assets for the given directory and languages.
	 *
	 * @private
	 * @param {String} outputDirectory Output directory for assets.
	 * @param {Iterable.<String>} languages Languages for assets.
	 */
	_getLocaleAssets( outputDirectory, languages ) {
		return Array.from( languages ).map( language => {
			const localeData = this._localeData[ language ];

			const outputPath = path.join( outputDirectory, `${ language }.js` );

			const outputBody = (
				// We need to ensure that the CKEDITOR_TRANSLATIONS variable exists and if it exists, we need to extend it.
				// Use ES5 because this bit will not be transpiled!
				'(function(d){' +
					`d['${ language }']=Object.assign(` +
						`d['${ language }']||{},` +
						`${ JSON.stringify( localeData ) }` +
					')' +
				'})(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
			);

			return { outputBody, outputPath };
		} );
	}

	/**
	 * Load translations from the PO files.
	 *
	 * @private
	 * @param {String} language PO file's language.
	 * @param {String} filePath Path to the target PO file.
	 */
	_loadLocaleFile( language, filePath ) {
		if ( !fs.existsSync( filePath ) ) {
			return;
		}

		const fileContent = fs.readFileSync( filePath, 'utf-8' );
		const parsedLocaleData = createDictionaryFromPoFileContent( fileContent );

		if ( !this._localeData[ language ] ) {
			this._localeData[ language ] = {};
		}

		const localeData = this._localeData[ language ];

		for ( const key in parsedLocaleData ) {
			localeData[ key ] = parsedLocaleData[ key ];
		}
	}

	/**
	 * Return path to the translation directory depending on the path to package.
	 * This method is protected to enable this class usage in other environments than CKE5.
	 *
	 * @protected
	 * @param {String} pathToPackage
	 * @returns {String}
	 */
	_getLocaleDirPath( pathToPackage ) {
		return path.join( pathToPackage, 'lang', 'translations' );
	}
};

