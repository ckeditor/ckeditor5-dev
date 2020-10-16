/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const WebpackNotifierPlugin = require( './webpacknotifierplugin' );
const { getPostCssConfig } = require( '@ckeditor/ckeditor5-dev-utils' ).styles;
const CKEditorWebpackPlugin = require( '@ckeditor/ckeditor5-dev-webpack-plugin' );
const webpack = require( 'webpack' );

/**
 * @param {Object} options
 * @param {Object} options.entries
 * @param {String} options.buildDir
 * @param {String} options.themePath
 * @param {String} [options.language]
 * @param {Array.<String>} [options.additionalLanguages]
 * @param {String|null} [options.identityFile]
 * @returns {Object}
 */
module.exports = function getWebpackConfigForManualTests( options ) {
	const definitions = Object.assign( {}, getDefinitionsFromFile( options.identityFile ) );

	return {
		mode: 'development',

		// Use cheap source maps because Safari had problem with ES6 + inline source maps.
		// We could use cheap source maps every where but karma-webpack doesn't support it:
		// https://github.com/webpack/karma-webpack/pull/76
		devtool: 'cheap-source-map',

		watch: true,

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
			new webpack.DefinePlugin( definitions )
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
										themePath: require.resolve(
											path.join( process.cwd(), 'node_modules', '@ckeditor/ckeditor5-theme-lark' )
										)
									},
									minify: true
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
};

/**
 * @param {String|null} definitionSource
 * @returns {Object}
 */
function getDefinitionsFromFile( definitionSource ) {
	if ( !definitionSource ) {
		return {};
	}

	try {
		const definitions = require( definitionSource );

		const stringifiedDefinitions = {};

		for ( const definitionName in definitions ) {
			stringifiedDefinitions[ definitionName ] = JSON.stringify( definitions[ definitionName ] );
		}

		return stringifiedDefinitions;
	} catch ( err ) {
		console.error( err.message );

		return {};
	}
}
