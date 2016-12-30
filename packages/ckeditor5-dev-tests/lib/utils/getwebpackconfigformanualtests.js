/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const CKEditorWebpackPlugin = require( '../../ckeditor-webpack-plugin' );
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
			new CKEditorWebpackPlugin( {
				packages: {
					'*': path.join( process.cwd(), 'node_modules' )
				}
			} ),
			new WebpackNotifierPlugin()
		],

		module: {
			rules: [
				{
					// test: **/ckeditor5-*/theme/icons/*.svg
					test: /ckeditor5-[^/]+\/theme\/icons\/[^/]+\.svg$/,
					use: [ 'raw-loader' ]
				},
				{
					// test: **/ckeditor5-*/theme/**/*.scss
					test: /\.scss$/,
					use: [ 'style-loader', 'css-loader', 'sass-loader' ]
				}
			]
		},

		resolveLoader: {
			modules: [
				path.resolve( __dirname, '..', '..', 'node_modules' )
			]
		}
	};
};
