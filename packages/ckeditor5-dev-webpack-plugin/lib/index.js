/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const serveTranslations = require( './servetranslations' );
const SingleLanguageTranslationService = require( '@ckeditor/ckeditor5-dev-utils/lib/translations/singlelanguagetranslationservice' );
const MultipleLanguageTranslationService = require( '@ckeditor/ckeditor5-dev-utils/lib/translations/multiplelanguagetranslationservice' );
const ckeditor5EnvUtils = require( './ckeditor5-env-utils' );

/**
 * CKEditorWebpackPlugin, for now, implements only the Translation Service (@ckeditor/ckeditor5#624, @ckeditor/ckeditor5#387).
 *
 * Workflow:
 *
 * One entry point (or to be precise one output JS file):
 * - one language in `languages` -> build optimized version
 * - many languages in `languages` –> get first or `defaultLanguage` as the main language that will be built into the main bundle
 * (e.g. `ckeditor.js`) (`languages` must support `all` option, that's why the `defaultLanguage` option is needed)
 *
 * Multiple output JS files
 * - one language in `languages` -> build optimized version
 * - many languages in `languages` –> emit all translation files separately and warn user,
 * that he needs to load translation file manually to get editor working
 */
module.exports = class CKEditorWebpackPlugin {
	/**
	 * @param {Object} [options] Plugin options.
	 * @param {Array.<String>|'all'} [options.languages] Target languages. Build is optimized if only one language is provided.
	 * When option is set to 'all' then script will be looking for all languages and according translations during the compilation.
	 * @param {String} [options.outputDirectory='lang'] Output directory for the emitted translation files,
	 * should be relative to the webpack context.
	 * @param {String} [options.defaultLanguage] Default language for the build. If not set, the first language will be used.
	 * @param {Boolean} [options.throwErrorOnMissingTranslation] Option that make the plugin throw when the translation is missing.
	 * By default original (english translation keys) are used when the target translation is missing.
	 */
	constructor( options = {} ) {
		this.options = options;
	}

	apply( compiler ) {
		if ( !this.options.languages ) {
			return;
		}

		let translationService;
		let compileAllLanguages = false;
		let languages = this.options.languages;

		if ( typeof languages == 'string' ) {
			if ( languages !== 'all' ) {
				throw new Error( '`languages` option should be an array of language codes or `all`.' );
			}

			compileAllLanguages = true;
			languages = []; // They will be searched in runtime.
		}

		const defaultLanguage = this.options.defaultLanguage || languages[ 0 ];

		if ( languages.length === 0 && !compileAllLanguages ) {
			throw new Error( chalk.red(
				'At least one target language should be specified.'
			) );
		}

		if ( languages.length === 1 ) {
			if ( this.options.outputDirectory ) {
				console.warn( chalk.red(
					'`outputDirectory` option does not work for one language because zero files will be emitted. It will be ignored.'
				) );
			}

			translationService = new SingleLanguageTranslationService( languages[ 0 ] );
		} else {
			translationService = new MultipleLanguageTranslationService( languages, { compileAllLanguages, defaultLanguage } );
		}

		serveTranslations( compiler, this.options, translationService, ckeditor5EnvUtils );
	}
};
