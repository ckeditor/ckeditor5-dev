/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const WebpackNotifierPlugin = require( './webpacknotifierplugin' );
const { getPostCssConfig } = require( '@ckeditor/ckeditor5-dev-utils' ).styles;
const CKEditorWebpackPlugin = require( '@ckeditor/ckeditor5-dev-webpack-plugin' );
const webpack = require( 'webpack' );
const getDefinitionsFromFile = require( '../getdefinitionsfromfile' );

/**
 * @param {Object} options
 * @param {String} options.cwd Current working directory. Usually it points to the CKEditor 5 root directory.
 * @param {Boolean} options.requireDll A flag describing whether DLL builds are required for starting the manual test server.
 * @param {Object} options.entries
 * @param {String} options.buildDir
 * @param {String} options.themePath
 * @param {Boolean} options.disableWatch
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
			new WebpackNotifierPlugin( options.onTestCompilationStatus ),
			new CKEditorWebpackPlugin( {
				// See https://ckeditor.com/docs/ckeditor5/latest/features/ui-language.html
				language: options.language,
				additionalLanguages: options.additionalLanguages,
				addMainLanguageTranslationsToAllAssets: true
			} ),
			new webpack.DefinePlugin( definitions ),
			new webpack.ProvidePlugin( {
				process: 'process/browser'
			} )
		],

		resolve: {
			extensions: [ '.ts', '.js', '.json' ]
		},

		module: {
			rules: [
				{
					test: /\.svg$/,
					use: [ 'raw-loader' ]
				},
				{
					test: /\.css$/,
					use: [
						{
							loader: 'style-loader',
							options: {
								injectType: 'singletonStyleTag',
								attributes: {
									'data-cke': true
								}
							}
						},
						'css-loader',
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: getPostCssConfig( {
									themeImporter: {
										themePath: options.themePath
									},
									sourceMap: true
								} )
							}
						}
					]
				},
				{
					test: /\.(txt|html)$/,
					use: [ 'raw-loader' ]
				},
				{
					test: /\.js$/,
					loader: require.resolve( '../ck-debug-loader' ),
					options: {
						debugFlags: options.debug
					}
				},
				{
					test: /\.ts$/,
					use: [
						{
							loader: require.resolve( '../ck-debug-loader' ),
							options: {
								debugFlags: options.debug
							}
						},
						{
							loader: 'ts-loader',
							options: {
								// Override default settings specified in `tsconfig.json`.
								compilerOptions: {
									// Do not emit any JS file as these TypeScript files are just passed through webpack.
									// Manual tests have their entry point. Only these files should be stored on a file system.
									// See: https://github.com/ckeditor/ckeditor5/issues/12111.
									noEmit: false,
									// When both (JS and TS) files are imported by a manual test while updating the JS files,
									// the `ts-loader` emits the "TypeScript emitted no output" error.
									// Disabling the `noEmitOnError` option fixes the problem.
									noEmitOnError: false
								}
							}
						}
					]
				}
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
		// When processing DLL manual tests, extra imports might appear in the code due to
		// usage of `CK_DEBUG_*` flags. In such a case, webpack requires the `DllReferencePlugin` plugin.
		//
		// Otherwise, it tries to import a file from a file system instead of the DLL build.
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

