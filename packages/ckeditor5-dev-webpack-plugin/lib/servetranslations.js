/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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
 * @param {Object} compiler The webpack compiler.
 * @param {Object} options Translation options.
 * @param {String} options.outputDirectory The output directory for the emitted translation files, relative to the webpack context.
 * @param {Boolean} [options.strict] An option that make this function throw when the error is found during the compilation.
 * @param {Boolean} [options.verbose] An option that make this function log everything into the console.
 * @param {String} [options.sourceFilesPattern] The source files pattern
 * @param {String} [options.packageNamesPattern] The package names pattern.
 * @param {String} [options.corePackagePattern] The core package pattern.
 * @param {TranslationService} translationService Translation service that will load PO files, replace translation keys and generate assets.
 * ckeditor5 - independent without hard-to-test logic.
 */
module.exports = function serveTranslations( compiler, options, translationService ) {
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
		} else {
			emitError(
				`Can't remove path to translation files directory (${ pathToLanguages }). Assert whether you specified a correct path.`
			);
		}
	}

	// Add core translations before `translateSourceLoader` starts translating.
	compiler.hooks.normalModuleFactory.tap( 'CKEditor5Plugin', normalModuleFactory => {
		const resolver = normalModuleFactory.getResolver( 'normal' );

		resolver.resolve( cwd, cwd, options.corePackageSampleResourcePath, {}, ( err, pathToResource ) => {
			if ( err ) {
				console.warn( 'Cannot find the CKEditor 5 core translation package (which defaults to `@ckeditor/ckeditor5-core`).' );

				return;
			}

			const corePackage = pathToResource.match( options.corePackagePattern )[ 0 ];

			translationService.loadPackage( corePackage );
		} );
	} );

	// Load translation files and add a loader if the package match requirements.
	compiler.hooks.compilation.tap( 'CKEditor5Plugin', compilation => {
		compilation.hooks.normalModuleLoader.tap( 'CKEditor5Plugin', ( context, module ) => {
			const relativePathToResource = path.relative( cwd, module.resource );

			if ( relativePathToResource.match( options.sourceFilesPattern ) ) {
				module.loaders.push( {
					loader: path.join( __dirname, 'translatesourceloader.js' ),
					options: { translateSource }
				} );

				const pathToPackage = getPathToPackage( cwd, module.resource, options.packageNamesPattern );

				translationService.loadPackage( pathToPackage );
			}
		} );

		// At the end of the compilation add assets generated from the PO files.
		// Use `optimize-chunk-assets` instead of `emit` to emit assets before the `webpack.BannerPlugin`.
		compilation.hooks.optimizeChunkAssets.tap( 'CKEditor5Plugin', chunks => {
			const generatedAssets = translationService.getAssets( {
				outputDirectory: options.outputDirectory,
				compilationAssetNames: Object.keys( compilation.assets )
			} );

			const allFiles = chunks.reduce( ( acc, chunk ) => [ ...acc, ...chunk.files ], [] );

			for ( const asset of generatedAssets ) {
				if ( asset.shouldConcat ) {
					// Concatenate sources to not break the file's sourcemap.
					const originalAsset = compilation.assets[ asset.outputPath ];

					compilation.assets[ asset.outputPath ] = new ConcatSource( asset.outputBody, '\n', originalAsset );
				} else {
					const chunkExists = allFiles.includes( asset.outputPath );

					if ( !chunkExists ) {
						// Assign `RawSource` when the corresponding chunk does not exist.
						compilation.assets[ asset.outputPath ] = new RawSource( asset.outputBody );
					} else {
						// Assign a string when the corresponding chunk exists and maintains the proper sourcemap.
						// Changing it to RawSource would break sourcemaps.
						compilation.assets[ asset.outputPath ] = asset.outputBody;
					}
				}
			}
		} );
	} );

	// A set of unique messages that prevents message duplications.
	const uniqueMessages = new Set();

	function emitError( error ) {
		if ( uniqueMessages.has( error ) ) {
			return;
		}

		uniqueMessages.add( error );

		if ( options.strict ) {
			throw new Error( chalk.red( error ) );
		}

		console.error( chalk.red( `[CKEditorWebpackPlugin] Error: ${ error }` ) );
	}

	function emitWarning( warning ) {
		if ( uniqueMessages.has( warning ) ) {
			return;
		}

		uniqueMessages.add( warning );

		if ( options.verbose ) {
			console.warn( chalk.yellow( `[CKEditorWebpackPlugin] Warning: ${ warning }` ) );
		}
	}
};

/**
 * Return path to the package if the resource comes from `ckeditor5-*` package.
 *
 * @param {String} cwd Current working directory.
 * @param {String} resource Absolute path to the resource.
 * @returns {String|null}
 */
function getPathToPackage( cwd, resource, packageNamePattern ) {
	const relativePathToResource = path.relative( cwd, resource );

	const match = relativePathToResource.match( packageNamePattern );

	if ( !match ) {
		return null;
	}

	const index = relativePathToResource.search( packageNamePattern ) + match[ 0 ].length;

	return relativePathToResource.slice( 0, index );
}

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

