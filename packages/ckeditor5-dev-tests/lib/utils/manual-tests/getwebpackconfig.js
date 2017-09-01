/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const WebpackNotifierPlugin = require( './webpacknotifierplugin' );

/**
 * @param {Object} entryObject
 * @param {String} buildDir
 * @returns {Object}
 */
module.exports = function getWebpackConfigForManualTests( entryObject, buildDir ) {
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
					test: /\.scss$/,
					use: [ 'style-loader', 'css-loader', 'sass-loader' ]
				},
				{
					test: /\.css$/,
					use: [ 'style-loader', 'css-loader' ]
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
