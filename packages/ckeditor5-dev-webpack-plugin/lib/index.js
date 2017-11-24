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
 * - `additinalLanguages` not set -> build optimized version
 * - `additinalLanguages` set –> `language` will be built into the main bundle (e.g. `ckeditor.js`).
 * Translation files will be emitted in the `outputDirectory` or 'lang' directory.
 *
 * Multiple output JS files
 * - `additinalLanguages` not set -> build optimized version
 * - `additinalLanguages` set –> emit all translation files separately and warn user,
 * that he needs to load at least one translation file manually to get editor working
 */
module.exports = class CKEditorWebpackPlugin {
	/**
	 * @param {Object} [options] Plugin options.
	 * @param {String} options.language Main language of the build that will be added to the bundle.
	 * @param {Array.<String>|'all'} [options.additionalLanguages] Additional languages. Build is optimized when this option is not set.
	 * When `additionalLanguages` is set to 'all' then script will be looking for all languages and according translations during
	 * the compilation.
	 * @param {String} [options.outputDirectory='lang'] Output directory for the emitted translation files,
	 * should be relative to the webpack context.
	 * @param {Boolean} [options.throwErrorOnMissingTranslation] Option that make the plugin throw when the translation is missing.
	 * By default original (english translation keys) are used when the target translation is missing.
	 */
	constructor( options = {} ) {
		this.options = options;
	}

	apply( compiler ) {
		if ( !this.options.language ) {
			return;
		}

		const language = this.options.language;
		let translationService;
		let compileAllLanguages = false;
		let additionalLanguages = this.options.additionalLanguages;

		if ( typeof additionalLanguages == 'string' ) {
			if ( additionalLanguages !== 'all' ) {
				throw new Error( '`additinalLanguages` option should be an array of language codes or `all`.' );
			}

			compileAllLanguages = true;
			additionalLanguages = []; // They will be searched in runtime.
		}

		if ( !additionalLanguages ) {
			if ( this.options.outputDirectory ) {
				console.warn( chalk.red(
					'`outputDirectory` option does not work for one language because zero files will be emitted. It will be ignored.'
				) );
			}

			translationService = new SingleLanguageTranslationService( language );
		} else {
			translationService = new MultipleLanguageTranslationService( language, { compileAllLanguages, additionalLanguages } );
		}

		serveTranslations( compiler, this.options, translationService, ckeditor5EnvUtils );
	}
};
