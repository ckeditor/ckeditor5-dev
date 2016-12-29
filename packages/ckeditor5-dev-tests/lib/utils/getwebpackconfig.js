/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */

'use strict';

const path = require( 'path' );
const CKEditorWebpackPlugin = require( '../../ckeditor-webpack-plugin' );
const NotifierPlugin = require( './notifier-plugin' );

/**
 * @param {Object} options
 * @returns {Object}
 */
module.exports = function createWebpackConfig( options ) {
	const config = {
		plugins: [
			new CKEditorWebpackPlugin( {
				useMainPackageModules: true,
				mainPackagePath: process.cwd(),
			} ),
			new NotifierPlugin(),
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
		}
	};

	if ( options.sourceMap ) {
		config.devtool = 'cheap-source-map';
	}

	if ( options.coverage ) {
		const excludePackageRegExps = options.packages
			.filter( dirname => {
				return !options.files.some( file => dirname.endsWith( file ) );
			} );

		config.module.rules.push( {
			test: /\.js$/,
			loader: 'babel-loader',
			query: {
				cacheDirectory: true,
				plugins: [ require( 'babel-plugin-transform-es2015-modules-commonjs' ) ]
			},
		}, {
			test: /\.js$/,
			loader: 'istanbul-instrumenter-loader',
			exclude: [
				...excludePackageRegExps,
				new RegExp( `${ path.sep }(node_modules|tests|theme|lib)${ path.sep }` ),
			],
			query: {
				esModules: true
			}
		} );
	}

	return config;
};