const utils = require( './utils' );
const { TranslationService } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;
const path = require( 'path' );

/**
 * Serve translations for multiple languages.
 *
 * @param {*} compiler Webpack compiler
 * @param {*} languages
 */
module.exports = function serveTranslations( compiler, languages ) {
	const translationService = new TranslationService( languages );

	compiler.options.translateSource = source => translationService.translateSource( source );

	// Add ckeditor5-core translations before translate-source-loader starts translating.
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

	compiler.plugin( 'compilation', compilation => {
		compilation.plugin( 'additional-assets', done => {
			for ( const lang of languages ) {
				const hashToTranslatedStringDictionary = translationService.getHashToTranslatedStringDictionary( lang );

				// TODO: Windows.
				const outputPath = path.join( 'lang', `${ lang }.js` );
				const stringifiedTranslations = JSON.stringify( hashToTranslatedStringDictionary, null, 2 );
				const outputBody = `CKEDITOR_TRANSLATIONS.add( '${ lang }', ${ stringifiedTranslations } )`;

				compilation.assets[ outputPath ] = {
					source: () => outputBody,
					size: () => outputBody.length,
				};

				console.log( `Created ${ outputPath } translation file.` );
			}

			done();
		} );
	} );

	// compiler.plugin( 'emit', compilation => {
	// 	for ( const chunk of compilation.chunks ) {
	// 		const resources = chunk.modules.map( m => m.resource );

	// 		console.log( chunk.files, resources );
	// 	}

	// 	process.exit();
	// } );
};
