const utils = require( './utils' );
const {	TranslationService } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;
const path = require( 'path' );

module.exports = function serveTranslations( compiler, languages ) {
	const allLanguages = [ languages.main, ...languages.additional ];

	const translationService = new TranslationService( allLanguages );

	compiler.options.translateSource = source => translationService.translateSource( source );

	// Adds ckeditor5-core translations before translate-source-loader starts translating.
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

	// Adds package to the translations if the resource comes from ckeditor5-* package.
	function maybeLoadPackage( resolveOptions ) {
		const packageNameRegExp = utils.CKEditor5PackageNameRegExp;
		const match = resolveOptions.resource.match( packageNameRegExp );

		if ( match ) {
			const index = resolveOptions.resource.search( packageNameRegExp ) + match[ 0 ].length;
			const pathToPackage = resolveOptions.resource.slice( 0, index );

			translationService.loadPackage( pathToPackage );
		}
	}

	// Injects loader when the file comes from ckeditor5-* packages.
	function maybeAddLoader( resolveOptions ) {
		if ( resolveOptions.resource.match( utils.CKEditor5PackageSrcFileRegExp ) ) {
			resolveOptions.loaders.unshift( path.join( __dirname, 'translatesourceloader.js' ) );
		}
	}

	compiler.plugin( 'emit', ( compilation, done ) => {
		for ( const lang of allLanguages ) {
			const hashToTranslatedStringDictionary = translationService.getHashToTranslatedStringDictionary( lang );

			// TODO: Windows.
			const outputPath = path.join( languages.outputDirectory, `${ lang }.json` );
			const output = JSON.stringify( hashToTranslatedStringDictionary, null, 2 );

			compilation.assets[ outputPath ] = {
				source: () => output,
				size: () => output.length,
			};

			console.log( `Created ${ outputPath } translation file.` );
		}

		done();
	} );
};
