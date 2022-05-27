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

		entry: options.entries,

		output: {
			path: options.buildDir
		},

		plugins: [
			new WebpackNotifierPlugin(),
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
					use: [
						{
							loader: 'esbuild-loader'
						},
						{
							loader: require.resolve( '../ck-debug-loader' ),
							options: {
								debugFlags: options.debug
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
				module: false,
				filename: '[file].map',
				append: '\n//# sourceMappingURL=[base].map'
			} )
		);
		webpackConfig.watch = true;
	}

	return webpackConfig;
};

