/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const WebpackNotifierPlugin = require( './webpacknotifierplugin' );
const { getPostCssConfig } = require( '@ckeditor/ckeditor5-dev-utils' ).styles;

/**
 * @param {Object} entryObject
 * @param {String} buildDir
 * @returns {Object}
 */
module.exports = function getWebpackConfigForManualTests( entryObject, buildDir, themePath ) {
	return {
		// Use cheap source maps because Safari had problem with ES6 + inline source maps.
		// We could use cheap source maps every where but karma-webpack doesn't support it:
		// https://github.com/webpack/karma-webpack/pull/76
		devtool: 'cheap-source-map',

		watch: true,

		entry: entryObject,

		output: {
			path: buildDir
		},

		plugins: [
			new WebpackNotifierPlugin()
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
								// Note: "singleton" option does not work when sourceMap is enabled.
								// See: https://github.com/webpack-contrib/style-loader/issues/134
								sourceMap: true
							}
						},
						{
							loader: 'postcss-loader',
							options: getPostCssConfig( {
								themePath,
								sourceMap: true
							} )
						},
					]
				},
				{
					test: /\.(txt|html)$/,
					use: [ 'raw-loader' ]
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
