/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const WebpackNotifierPlugin = require( './webpacknotifierplugin' );
const { getPostCssConfig } = require( '@ckeditor/ckeditor5-dev-utils' ).styles;
const CKEditorWebpackPlugin = require( '@ckeditor/ckeditor5-dev-webpack-plugin' );

/**
 * @param {Object} options
 * @param {Object} options.entries
 * @param {String} options.buildDir
 * @param {String} options.themePath
 * @param {String} [options.language]
 * @param {Array.<String>} [options.additionalLanguages]
 * @returns {Object}
 */
module.exports = function getWebpackConfigForManualTests( options ) {
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
				allowMultipleJSOutputs: true
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
						{
							loader: 'postcss-loader',
							options: getPostCssConfig( {
								themeImporter: {
									themePath: options.themePath
								},
								sourceMap: true
							} )
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
					query: {
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
