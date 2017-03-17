/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const webpack = require( 'webpack' );
const getWebpackES6Config = require( './getwebpackes6config' );

/**
 * @param options
 * @param {String} options.entryPoint An entry point which will be compiled.
 * @param {String} options.destinationPath A path where compiled file will be saved.
 * @param {String} options.moduleName A name of exported module after compilation.
 * @param {String} options.cwd Current work directory. Required for searching the modules.
 * @returns {Object}
 */
module.exports = function getWebpackConfig( options ) {
	const config = getWebpackES6Config( options );

	config.output.filename = 'ckeditor.js';

	config.plugins = [
		new webpack.optimize.UglifyJsPlugin( {
			sourceMap: true
		} )
	];

	config.module.rules.push( {
		test: /\.js$/,
		loader: 'babel-loader',
		options: {
			presets: [
				'es2015'
			]
		}
	} );

	return config;
};
