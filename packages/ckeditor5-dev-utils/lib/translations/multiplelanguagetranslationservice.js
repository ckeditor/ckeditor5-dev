/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const findMessageIds = require( './findmessageids' );
const { EventEmitter } = require( 'events' );
const PO = require( 'pofile' );
const { promisify } = require( 'util' );

const readFile = promisify( fs.readFile );

/**
 * TODO
 */
module.exports = class MultipleLanguageTranslationService extends EventEmitter {
	/**
	 * @param {String} language The target language that will be bundled into the main webpack asset.
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
		 * language -> messageId -> translations dictionaries.
		 *
		 * @type {Object.<String, Object.<String,Array.<String>>>}
		 * @private
		 */
		this._dictionaries = {};

		this._pluralFormsRules = {};

		/**
		 * A set of message ids that were found in parsed source files and will be presented in the editor's UI.
		 * For each message id we need to find translations (single and possible plural forms) for the target languages.
		 */
		this._foundMessageIds = new Set();
	}

	/**
	 * Translate file's source and replace `t()` call strings with short ids.
	 * Fire an error when the acorn parser face a trouble.
	 *
	 * @fires error
	 * @param {String} source Source of the file.
	 * @returns {String}
	 */
	translateSource( source, sourceFile ) {
		findMessageIds(
			source,
			sourceFile,
			messageId => this._foundMessageIds.add( messageId ),
			error => this.emit( 'warning', error )
		);

		return source;
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
				'Found many webpack assets and CKEditor 5 translations for the main language were added to all of them',
			].join( '\n' ) );
		}

		const otherLanguages = Array.from( this._languages )
			.filter( lang => lang !== this._mainLanguage );

		return [
			...compilationAssetNames.map( assetName => ( {
				outputBody: this._getTranslationAssets( outputDirectory, [ this._mainLanguage ] )[ 0 ].outputBody,
				outputPath: assetName,
				shouldConcat: true
			} ) ),
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
			const outputPath = path.join( outputDirectory, `${ language }.js` );

			if ( !this._dictionaries[ language ] ) {
				this.emit( 'error', `No translation found for ${ language } language.` );

				return { outputBody, outputPath };
			}

			const translations = this._getTranslations( language );

			// A plural form is in the form of .pluralForms="nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2)"
			/** @type {String} */
			const pluralForms = this._pluralFormsRules[ language ];
			const pluralFormFunctionBodyMatch = pluralForms.match( /(?:plural=\()(.+)(?:\))/ );

			// Add support for ES5 - this function won't be transpiled.
			const pluralFormFunction = `function(n){return ${ pluralFormFunctionBodyMatch[ 1 ] };}`;

			// Stringify translations and remove unnecessary `""` around property names.
			const stringifiedTranslations = JSON.stringify( translations )
				.replace( /"([\w_]+)":/g, '$1:' );

			const outputBody = (
				// We need to ensure that the CKEDITOR_TRANSLATIONS variable exists and if it exists, we need to extend it.
				// Use ES5 because this bit will not be transpiled!
				'(function(d){' +
				`	const l = d['${ language }'] = d['${ language }'] || {};` +
				`	l.dictionary=Object.assign(` +
				`		l.dictionary||{},` +
				`		${ stringifiedTranslations }` +
				'	);' +
				`	l.getFormIndex=${ pluralFormFunction };` +
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
	 * @param {String} language Target language.
	 * @returns {Object.<String,String|String[]>}
	 */
	_getTranslations( language ) {
		const langDictionary = this._dictionaries[ language ];
		const translatedStrings = {};

		for ( const messageId of this._foundMessageIds ) {
			const translatedMessage = langDictionary[ messageId ];

			if ( !translatedMessage || translatedMessage.length === 0 ) {
				// this.emit( 'warning', `Missing translation for '${ messageId }' for '${ language }' language.` );

				continue;
			}

			// Register only the single form (a string) if no plural form is provided.
			translatedStrings[ messageId ] = translatedMessage.length > 1 ?
				translatedMessage :
				translatedMessage[ 0 ];
		}

		return translatedStrings;
	}

	/**
	 * Load translations from the PO file if that file exists.
	 *
	 * @private
	 * @param {String} language PO file's language.
	 * @param {String} pathToPoFile Path to the target PO file.
	 */
	_loadPoFile( language, pathToPoFile ) {
		if ( !fs.existsSync( pathToPoFile ) ) {
			return;
		}

		const parsedTranslationFile = PO.parse( fs.readFileSync( pathToPoFile, 'utf-8' ) );

		this._pluralFormsRules[ language ] = this._pluralFormsRules[ language ] || parsedTranslationFile.headers[ 'Plural-Forms' ];

		if ( !this._dictionaries[ language ] ) {
			this._dictionaries[ language ] = {};
		}

		const dictionary = this._dictionaries[ language ];

		for ( const item of parsedTranslationFile.items ) {
			dictionary[ item.msgid ] = item.msgstr;
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
	_getPathToTranslationDirectory( pathToPackage ) {
		return path.join( pathToPackage, 'lang', 'translations' );
	}
};
