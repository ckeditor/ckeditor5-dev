/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
 * When one entry point (or to be precise one output JS file) is defined, language specified in `language` option will be
 * statically added to the bundle. When `additionalLanguages` option is set, languages specified there will be stored
 * in separate files.
 *
 * When multiple outputs are defined, all languages (from both `language` and `additionalLanguages` options) will be
 * stored in separate files. In that situation user will be warned that he needs to load at least one translation file
 * manually to get editor working.
 *
 * Translation files will be emitted in the `outputDirectory` or `'lang'` directory if `outputDirectory` is not set.
 *
 * Plugin tries to clean the output translation directory before each build to make sure, that all translations are correct.
 * See https://github.com/ckeditor/ckeditor5/issues/700 for more information.
 */
module.exports = class CKEditorWebpackPlugin {
	/**
	 * @param {Object} [options] Plugin options.
	 * @param {String} options.language Main language of the build that will be added to the bundle.
	 * @param {Array.<String>|'all'} [options.additionalLanguages] Additional languages. Build is optimized when this option is not set.
	 * When `additionalLanguages` is set to 'all' then script will be looking for all languages and according translations during
	 * the compilation.
	 * @param {String} [options.outputDirectory='translations'] Output directory for the emitted translation files,
	 * should be relative to the webpack context.
	 * @param {Boolean} [options.strict] Option that make the plugin throw when the error is found during the compilation.
	 * @param {Boolean} [options.verbose] Option that make this plugin log all warnings into the console.
	 */
	constructor( options = {} ) {
		this.options = {
			language: options.language,
			additionalLanguages: options.additionalLanguages,
			outputDirectory: options.outputDirectory || 'translations',
			strict: !!options.strict,
			verbose: !!options.verbose
		};
	}

	apply( compiler ) {
		if ( !this.options.language ) {
			console.warn( chalk.yellow(
				'Warning: `language` option is required for CKEditorWebpackPlugin plugin.'
			) );

			return;
		}

		const language = this.options.language;
		let translationService;
		let compileAllLanguages = false;
		let additionalLanguages = this.options.additionalLanguages;

		if ( typeof additionalLanguages == 'string' ) {
			if ( additionalLanguages !== 'all' ) {
				throw new Error( 'Error: `additionalLanguages` option should be an array of language codes or `all`.' );
			}

			compileAllLanguages = true;
			additionalLanguages = []; // They will be searched in runtime.
		}

		if ( !additionalLanguages ) {
			if ( this.options.outputDirectory !== 'translations' && this.options.verbose ) {
				console.warn( chalk.yellow(
					'Warning: `outputDirectory` option does not work for one language. It will be ignored.'
				) );
			}

			translationService = new SingleLanguageTranslationService( language );
		} else {
			translationService = new MultipleLanguageTranslationService( language, { compileAllLanguages, additionalLanguages } );
		}

		serveTranslations( compiler, this.options, translationService, ckeditor5EnvUtils );
	}
};
