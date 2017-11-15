const utils = require( './utils' );
const path = require( 'path' );
const chalk = require( 'chalk' );

/**
 * Serve translations depending on the used translation service and passed options.
 * It takes care about whole Webpack compilation process.
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
 * @param {TranslationService} translationService Translation service that will load PO files, replace translation keys and generate assets.
 */
module.exports = function serveTranslations( compiler, options, translationService ) {
	const cwd = process.cwd();

	// Provides translateSource method for the `translatesourceloader` loader.
	compiler.options.translateSource = ( source, sourceFile ) => translationService.translateSource( source, sourceFile );

	// Watch for errors during translation process.
	translationService.on( 'error', error => {
		if ( options.throwErrorOnMissingTranslation ) {
			throw new Error( chalk.red( error ) );
		}

		console.error( chalk.red( error ) );
	} );

	// Add ckeditor5-core translations before `translatesourceloader` starts translating.
	compiler.plugin( 'after-resolvers', () => {
		compiler.resolvers.normal.resolve( cwd, cwd, '@ckeditor/ckeditor5-core/src/editor/editor.js', ( err, result ) => {
			const pathToCoreTranslationPackage = result.match( utils.CKEditor5CoreRegExp )[ 0 ];

			translationService.loadPackage( pathToCoreTranslationPackage );
		} );
	} );

	compiler.plugin( 'normal-module-factory', nmf => {
		nmf.plugin( 'after-resolve', ( resolveOptions, done ) => {
			maybeLoadPackage( resolveOptions );
			maybeAddLoader( resolveOptions );

			done( null, resolveOptions );
		} );
	} );

	compiler.plugin( 'compilation', compilation => {
		compilation.plugin( 'additional-assets', done => {
			addAssetsToExistingOnes( compilation.assets );

			done();
		} );
	} );

	// Add package to the translations if the resource comes from ckeditor5-* package.
	function maybeLoadPackage( resolveOptions ) {
		const packageNameRegExp = utils.CKEditor5PackageNameRegExp;
		const relativePathToResource = path.relative( cwd, resolveOptions.resource );

		const match = relativePathToResource.match( packageNameRegExp );

		if ( match ) {
			const index = relativePathToResource.search( packageNameRegExp ) + match[ 0 ].length;
			const pathToPackage = relativePathToResource.slice( 0, index );

			translationService.loadPackage( pathToPackage );
		}
	}

	// Inject loader when the file comes from ckeditor5-* packages.
	function maybeAddLoader( resolveOptions ) {
		const relativePathToResource = path.relative( cwd, resolveOptions.resource );

		if ( relativePathToResource.match( utils.CKEditor5PackageSrcFileRegExp ) ) {
			resolveOptions.loaders.unshift( path.join( __dirname, 'translatesourceloader.js' ) );
		}
	}

	// At the end add assets generated from the PO files.
	function addAssetsToExistingOnes( destinationAssets ) {
		const generatedAssets = translationService.getAssets( { outputDirectory: options.outputDirectory } );

		for ( const asset of generatedAssets ) {
			destinationAssets[ asset.outputPath ] = {
				source: () => asset.outputBody,
				size: () => asset.outputBody.length,
			};
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
 * Return assets
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

