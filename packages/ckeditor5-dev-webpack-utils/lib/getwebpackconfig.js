/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const webpack = require( 'webpack' );

/**
 * @param options
 * @param {String} options.entryPoint An entry point which will be compiled.
 * @param {String} options.destinationPath A path where compiled file will be saved.
 * @param {String} options.moduleName A name of exported module after compilation.
 * @param {String} options.cwd Current work directory. Required for searching the modules.
 * @returns {Object}
 */
module.exports = function getWebpackConfig( options ) {
	return {
		devtool: 'cheap-source-map',

		entry: options.entryPoint,

		output: {
			path: options.destinationPath,
			filename: 'ckeditor.js',
			libraryTarget: 'umd',
			library: options.moduleName
		},

		plugins: [
			new webpack.optimize.UglifyJsPlugin( {
				sourceMap: true
			} )
		],

		module: {
			rules: [
				{
					test: /\.js$/,
					loader: 'babel-loader',
					options: {
						presets: [
							'es2015'
						]
					}
				},
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
				path.join( options.cwd, 'node_modules' )
			]
		}
	};
};
