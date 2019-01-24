/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const rimraf = require( 'rimraf' );
const fs = require( 'fs' );
const path = require( 'path' );
const { RawSource, ConcatSource } = require( 'webpack-sources' );

/**
 * Serve translations depending on the used translation service and passed options.
 * It takes care about whole Webpack compilation process and doesn't contain much logic that should be tested.
 *
 * See https://webpack.js.org/api/compiler/#event-hooks and https://webpack.js.org/api/compilation/ for details about specific hooks.
 *
 * @param {Object} compiler Webpack compiler.
 * @param {Object} options Translation options.
 * @param {String} options.outputDirectory Output directory for the emitted translation files, relative to the webpack context.
 * @param {Boolean} [options.strict] Option that make this function throw when the error is found during the compilation.
 * @param {Boolean} [options.verbose] Option that make this function log everything into the console.
 * @param {TranslationService} translationService Translation service that will load PO files, replace translation keys and generate assets.
 * @param {Object} envUtils Environment utils internally called within the `serveTranslations()`, that make `serveTranslations()`
 * ckeditor5 - independent without hard-to-test logic.
 */
module.exports = function serveTranslations( compiler, options, translationService, envUtils ) {
	const cwd = process.cwd();

	// Provides translateSource function for the `translatesourceloader` loader.
	const translateSource = ( source, sourceFile ) => translationService.translateSource( source, sourceFile );

	// Watch for warnings and errors during translation process.
	translationService.on( 'error', emitError );
	translationService.on( 'warning', emitWarning );

	// Remove old translation files.
	// Assert whether the translation output directory exists inside the cwd.
	const pathToLanguages = path.join( compiler.options.output.path, options.outputDirectory );

	if ( fs.existsSync( pathToLanguages ) ) {
		if ( pathToLanguages.includes( cwd ) && cwd !== pathToLanguages ) {
			rimraf.sync( pathToLanguages );

			if ( options.verbose ) {
				console.log( `Removed ${ pathToLanguages }. directory to be sure, that all translation files will be correct.` );
			}
		} else {
			emitError(
				`Can't remove path to translation files directory (${ pathToLanguages }). Assert whether you specified a correct path.`
			);
		}
	}

	// Add core translations before `translateSourceLoader` starts translating.
	compiler.hooks.normalModuleFactory.tap( 'CKEditor5Plugin', normalModuleFactory => {
		const resolver = normalModuleFactory.getResolver( 'normal' );
		const corePackageSampleResource = envUtils.getCorePackageSampleResource();

		resolver.resolve( cwd, cwd, corePackageSampleResource, {}, ( err, pathToResource ) => {
			if ( err ) {
				console.error( err );

				return;
			}

			const corePackage = envUtils.getCorePackagePath( pathToResource );

			translationService.loadPackage( corePackage );
		} );
	} );

	// Load translation files and add a loader if the package match requirements.
	compiler.hooks.compilation.tap( 'CKEditor5Plugin', compilation => {
		compilation.hooks.normalModuleLoader.tap( 'CKEditor5Plugin', ( context, module ) => {
			const pathToPackage = envUtils.getPathToPackage( cwd, module.resource );
			module.loaders = envUtils.getLoaders( cwd, module.resource, module.loaders, { translateSource } );

			if ( pathToPackage ) {
				translationService.loadPackage( pathToPackage );
			}
		} );

		// At the end of the compilation add assets generated from the PO files.
		// Use `optimize-chunk-assets` instead of `emit` to emit assets before the `webpack.BannerPlugin`.
		compilation.hooks.optimizeChunkAssets.tap( 'CKEditor5Plugin', chunks => {
			const generatedAssets = translationService.getAssets( {
				outputDirectory: options.outputDirectory,
				compilationAssets: compilation.assets
			} );

			const allFiles = chunks.reduce( ( acc, chunk ) => [ ...acc, ...chunk.files ], [] );

			for ( const asset of generatedAssets ) {
				if ( asset.shouldConcat ) {
					// We need to concat sources here to support source maps for CKE5 code.
					const originalAsset = compilation.assets[ asset.outputPath ];

					compilation.assets[ asset.outputPath ] = new ConcatSource( asset.outputBody, '\n', originalAsset );
				} else {
					const chunkExists = allFiles.includes( asset.outputPath );

					if ( !chunkExists ) {
						// RawSource is used when corresponding chunk does not exist.
						compilation.assets[ asset.outputPath ] = new RawSource( asset.outputBody );
					} else {
						// String is used when corresponding chunk exists and maintain proper sourcemaps.
						// Changing to RawSource would drop source maps.
						compilation.assets[ asset.outputPath ] = asset.outputBody;
					}
				}
			}
		} );
	} );

	function emitError( error ) {
		if ( options.strict ) {
			throw new Error( chalk.red( error ) );
		}

		console.error( chalk.red( `Error: ${ error }` ) );
	}

	function emitWarning( warning ) {
		if ( options.verbose ) {
			console.warn( chalk.yellow( `Warning: ${ warning }` ) );
		}
	}
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

