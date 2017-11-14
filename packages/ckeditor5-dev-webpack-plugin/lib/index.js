/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const serveTranslations = require( './serve-translations' );
const {
	MultipleLanguageTranslationService,
	SingleLanguageTranslationService
} = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

module.exports = class CKEditorWebpackPlugin {
	/**
	 * @param {Object} [options]
	 * @param {Array.<String>} [options.packages] Array of directories in which packages will be looked for.
	 * @param {Object} [options.languages]
	 * TODO: Fix params.
	 */
	constructor( options = {} ) {
		this.options = options;
	}

	apply( compiler ) {
		if ( !this.options.languages ) {
			return;
		}

		let translationService;

		if ( this.options.optimizeBuildForOneLanguage ) {
			if ( this.options.languages.length > 1 ) {
				throw new Error( 'Only one language should be specified when `optimizeBuildForOneLanguage` option is on.' );
			}

			translationService = new SingleLanguageTranslationService( this.options.languages[ 0 ] );
		} else {
			translationService = new MultipleLanguageTranslationService( this.options.languages );
		}

		serveTranslations( compiler, this.options, translationService );
	}
};
