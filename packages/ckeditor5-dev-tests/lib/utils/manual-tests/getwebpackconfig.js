/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const webpack = require( 'webpack' );
const { CKEditorTranslationsPlugin } = require( '@ckeditor/ckeditor5-dev-translations' );
const { loaders } = require( '@ckeditor/ckeditor5-dev-utils' );
const WebpackNotifierPlugin = require( './webpacknotifierplugin' );
const getDefinitionsFromFile = require( '../getdefinitionsfromfile' );

/**
 * @param {Object} options
 * @param {String} options.cwd Current working directory. Usually it points to the CKEditor 5 root directory.
 * @param {Boolean} options.requireDll A flag describing whether DLL builds are required for starting the manual test server.
 * @param {Object} options.entries
 * @param {String} options.buildDir
 * @param {String} options.themePath
 * @param {Boolean} options.disableWatch
 * @param {String} [options.tsconfig]
 * @param {String} [options.language]
 * @param {Array.<String>} [options.additionalLanguages]
 * @param {String|null} [options.identityFile]
 * @returns {Object}
 */
module.exports = function getWebpackConfigForManualTests( options ) {
	const definitions = Object.assign( {}, getDefinitionsFromFile( options.identityFile ) );

	const webpackConfig = {
		mode: 'none',

		watchOptions: {
			aggregateTimeout: 500
		},

		entry: options.entries,

		output: {
			path: options.buildDir
		},

		plugins: [
			new WebpackNotifierPlugin( {
				onTestCompilationStatus: options.onTestCompilationStatus,
				processName: options.requireDll ? 'DLL' : 'non-DLL'
			} ),
			new CKEditorTranslationsPlugin( {
				// See https://ckeditor.com/docs/ckeditor5/latest/features/ui-language.html
				language: options.language,
				additionalLanguages: options.additionalLanguages,
				addMainLanguageTranslationsToAllAssets: true
			} ),
			new webpack.DefinePlugin( definitions ),
			new webpack.ProvidePlugin( {
				Buffer: [ 'buffer', 'Buffer' ],
				process: 'process/browser'
			} )
		],

		resolve: {
			extensions: [ '.ts', '.js', '.json' ]
		},

		module: {
			rules: [
				loaders.getIconsLoader( { matchExtensionOnly: true } ),

				loaders.getStylesLoader( {
					themePath: options.themePath,
					sourceMap: true
				} ),

				loaders.getFormattedTextLoader(),

				loaders.getTypeScriptLoader( {
					configFile: options.tsconfig,
					includeDebugLoader: true,
					debugFlags: options.debug
				} ),

				loaders.getJavaScriptLoader( { debugFlags: options.debug } )
			]
		},

		resolveLoader: {
			modules: [
				'node_modules',
				path.resolve( __dirname, '..', '..', '..', 'node_modules' )
			]
		}
	};

	if ( !options.disableWatch ) {
		webpackConfig.plugins = webpackConfig.plugins || [];
		webpackConfig.plugins.push(
			// After bumping the webpack to v5 and other related tools/libs/whatever, the source maps stopped working, because for unknown
			// reasons the path to the generated source map was invalid. The solution for this problem is to manually configure the path to
			// the source maps using the `append` configuration option.
			//
			// Example:
			//
			// After running `yarn run manual -f alignment` we have:
			// - the `[base]` placeholder contains only the file name: `alignment.js`,
			// - the `[file]` placeholder contains the relative path to the test file: `ckeditor5-alignment/tests/manual/alignment.js`.
			//
			// See https://github.com/ckeditor/ckeditor5/issues/11006.
			//
			// Previously, the 'cheap-source-map' was used, because Safari had problem with ES6 + inline source maps.
			// We could use cheap source maps everywhere, but karma-webpack doesn't support it. The `columns` and `module` options
			// set to `false` are equivalent to the use of `webpackConfig.devtool = 'cheap-source-map'`.
			//
			// See https://github.com/webpack/karma-webpack/pull/76.
			new webpack.SourceMapDevToolPlugin( {
				columns: false,
				module: true,
				filename: '[file].map',
				append: '\n//# sourceMappingURL=[base].map'
			} )
		);
		webpackConfig.watch = true;
	}

	if ( options.requireDll ) {
		// When processing manual tests, if any of them require a DLL build, the manual test server adds the `DllReferencePlugin` plugin
		// to the configuration to avoid the duplicated modules error when using an import statement behind the `CK_DEBUG_*` flags.
		//
		// Otherwise, webpack tries to import a file from a file system instead of the DLL build.
		// It leads to the CKEditor 5 duplicated modules error.
		//
		// See: https://github.com/ckeditor/ckeditor5/issues/12791.
		const manifestPath = path.join( options.cwd, 'build', 'ckeditor5-dll.manifest.json' );
		const dllReferencePlugin = new webpack.DllReferencePlugin( {
			manifest: require( manifestPath ),
			scope: 'ckeditor5/src',
			name: 'CKEditor5.dll'
		} );

		webpackConfig.plugins.push( dllReferencePlugin );
	}

	return webpackConfig;
};

