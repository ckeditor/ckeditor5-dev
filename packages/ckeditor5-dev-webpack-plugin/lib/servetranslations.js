/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

/**
 * Serve translations depending on the used translation service and passed options.
 * It takes care about whole Webpack compilation process and doesn't contain much logic that should be tested.
 *
 * See https://webpack.js.org/api/compiler/#event-hooks and https://webpack.js.org/api/compilation/ for details about specific hooks.
 *
 * @param {Object} compiler Webpack compiler.
 * @param {Object} options Translation options.
 * @param {Array.<String>} options.languages Target languages.
 * @param {String} [options.outputDirectory='lang'] Output directory for the emitted translation files,
 * should be relative to the webpack context.
 * @param {Boolean} [options.throwErrorOnMissingTranslation] Option that make this function throw when the translation is missing.
 * By default original (english translation keys) are used when the target translation is missing.
 * @param {Boolean} [options.verbose] Option that make this function log everything into the console.
 * @param {TranslationService} translationService Translation service that will load PO files, replace translation keys and generate assets.
 * @param {Object} envUtils Environment utils internally called within the `serveTranslations()`, that make `serveTranslations()`
 * ckeditor5 - independent without hard-to-test logic.
 */
module.exports = function serveTranslations( compiler, options, translationService, envUtils ) {
	const cwd = process.cwd();

	// Provides translateSource method for the `translatesourceloader` loader.
	compiler.options.translateSource = ( source, sourceFile ) => translationService.translateSource( source, sourceFile );

	// Watch for warnings and errors during translation process.
	translationService.on( 'error', error => {
		if ( options.throwErrorOnMissingTranslation ) {
			throw new Error( chalk.red( error ) );
		}

		console.error( chalk.red( `Error: ${ error }` ) );
	} );

	translationService.on( 'warning', warning => {
		if ( options.verbose ) {
			console.warn( chalk.yellow( `Warning: ${ warning }` ) );
		}
	} );

	// Add core translations before `translatesourceloader` starts translating.
	compiler.plugin( 'after-resolvers', () => {
		const resolver = compiler.resolvers.normal;

		envUtils.getCorePackage( cwd, resolver ).then( corePackage => {
			translationService.loadPackage( corePackage );
		} );
	} );

	// Load translation files and add a loader if the package match requirements.
	compiler.plugin( 'normal-module-factory', nmf => {
		nmf.plugin( 'after-resolve', ( resolveOptions, done ) => {
			const pathToPackage = envUtils.getPathToPackage( cwd, resolveOptions.resource );
			resolveOptions.loaders = envUtils.getLoaders( cwd, resolveOptions.resource, resolveOptions.loaders );

			if ( pathToPackage ) {
				translationService.loadPackage( pathToPackage );
			}

			done( null, resolveOptions );
		} );
	} );

	// At the end of the compilation add assets generated from the PO files.
	compiler.plugin( 'emit', ( compilation, done ) => {
		const generatedAssets = translationService.getAssets( {
			outputDirectory: options.outputDirectory,
			compilationAssets: compilation.assets
		} );

		for ( const asset of generatedAssets ) {
			compilation.assets[ asset.outputPath ] = {
				source: () => asset.outputBody,
				size: () => asset.outputBody.length,
			};
		}

		done();
	} );
};

/**
 * TranslationService interface.
 *
 * It should extend or mix NodeJS' EventEmitter to provide `on()` method.
 *
 * @interface TranslationService
 */

/**
 * Load package translations.
 *
 * @method #loadPackage
 * @param {String} pathToPackage Path to the package.
 */

/**
 * Translate file's source to the target language.
 *
 * @method #translateSource
 * @param {String} source File's source.
 * @returns {String}
 */

/**
 * Get assets at the end of compilation.
 *
 * @method #getAssets
 * @returns {Array.<Object>}
 */

/**
 * Error found during the translation process.
 *
 * @fires error
 */

