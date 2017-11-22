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

module.exports = class CKEditorWebpackPlugin {
	/**
	 * @param {Object} [options] Plugin options.
	 * @param {Array.<String>} [options.languages] Target languages.
	 * @param {String} [options.outputDirectory='lang'] Output directory for the emitted translation files,
	 * should be relative to the webpack context.
	 * @param {Boolean} [options.optimizeBuildForOneLanguage] Option that optimizes build for one language (directly replaces translation
	 * keys with the target language's strings. Webpack won't emit any language file with that option enabled.
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

		if ( languages.length === 0 && !compileAllLanguages ) {
			throw new Error( chalk.red(
				'At least one target language should be specified.'
			) );
		}

		if ( this.options.optimizeBuildForOneLanguage ) {
			if ( languages.length > 1 || compileAllLanguages ) {
				throw new Error( chalk.red(
					'Only one language should be specified when `optimizeBuildForOneLanguage` option is on.'
				) );
			}

			if ( this.options.outputDirectory ) {
				console.error( chalk.red(
					'`outputDirectory` option does not work with `optimizeBuildForOneLanguage` option. It will be ignored.'
				) );
			}

			translationService = new SingleLanguageTranslationService( languages[ 0 ] );
		} else {
			translationService = new MultipleLanguageTranslationService( languages, compileAllLanguages );
		}

		serveTranslations( compiler, this.options, translationService, ckeditor5EnvUtils );
	}
};
