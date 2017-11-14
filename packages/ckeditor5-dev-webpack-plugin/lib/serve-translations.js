const utils = require( './utils' );
const path = require( 'path' );
const flatten = require( 'lodash/flatten' );
const chalk = require( 'chalk' );

/**
 * Serve translations depending on the used translation service and passed options.
 *
 * @param {*} compiler Webpack compiler
 * @param {Object} options Translation options
 * @param {String} options.languages Target languages
 * @param {Boolean} [options.throwErrorOnMissingTranslation] Throw when the translation is missing.
 * By default original (english strings) are used when the target translation is missing.
 * @param {String} [options.outputDirectory='lang'] Output directory for the emitted translation files.
 * @param {TranslationService} translationService
 */
module.exports = function serveTranslations( compiler, options, translationService ) {
	// Provides translateSource method for the `translatesourceloader` loader.
	compiler.options.translateSource = source => translationService.translateSource( source );

	// Add ckeditor5-core translations before `translatesourceloader` starts translating.
	compiler.plugin( 'after-resolvers', () => {
		compiler.resolvers.normal.resolve(
			process.cwd(),
			process.cwd(),
			'@ckeditor/ckeditor5-core/src/editor/editor.js',
			( err, result ) => {
				const pathToCoreTranslationPackage = result.match( utils.CKEditor5CoreRegExp )[ 0 ];

				translationService.loadPackage( pathToCoreTranslationPackage );
			}
		);
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
		const match = resolveOptions.resource.match( packageNameRegExp );

		if ( match ) {
			const index = resolveOptions.resource.search( packageNameRegExp ) + match[ 0 ].length;
			const pathToPackage = resolveOptions.resource.slice( 0, index );

			translationService.loadPackage( pathToPackage );
		}
	}

	// Inject loader when the file comes from ckeditor5-* packages.
	function maybeAddLoader( resolveOptions ) {
		if ( resolveOptions.resource.match( utils.CKEditor5PackageSrcFileRegExp ) ) {
			resolveOptions.loaders.unshift( path.join( __dirname, 'translatesourceloader.js' ) );
		}
	}

	function addAssetsToExistingOnes( destinationAssets ) {
		const generatedAssets = translationService.getAssets( { outputDirectory: options.outputDirectory } );

		const errors = flatten( generatedAssets.map( asset => asset.errors ) );

		if ( errors.length && options.throwErrorOnMissingTranslation ) {
			throw new Error( errors.join( '\n' ) + '\n' );
		}

		for ( const error of errors ) {
			console.error( chalk.red( error ) );
		}

		for ( const asset of generatedAssets ) {
			destinationAssets[ asset.outputPath ] = {
				source: () => asset.outputBody,
				size: () => asset.outputBody.length,
			};
		}
	}
};
