/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const CKEditorWebpackPlugin = require( '../../ckeditor-webpack-plugin' );

/**
 * @param {Object} options
 * @returns {Object}
 */
module.exports = function getWebpackConfig( options ) {
	const config = {
		plugins: [
			new CKEditorWebpackPlugin( {
				useMainPackageModules: true,
				mainPackagePath: process.cwd(),
			} )
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
		// Note: karma-sourcemap-loader works only with inline source maps.
		// See https://github.com/webpack/karma-webpack/pull/76.
		// We use cheap source maps for manual tests because Safari
		// had problems with inline source maps and ES6. This means that
		// you can't have source maps in automated tests in Safari.
		config.devtool = 'inline-source-map';
	}

	if ( options.coverage ) {
		const excludePackageRegExps = options.packages
			.filter( dirname => {
				return !options.files.some( file => dirname.endsWith( file ) );
			} );

		config.module.rules.push(
			{
				test: /\.js$/,
				loader: 'babel-loader',
				query: {
					cacheDirectory: true,
					plugins: [ require( 'babel-plugin-transform-es2015-modules-commonjs' ) ]
				}
			},
			{
				test: /\.js$/,
				loader: 'istanbul-instrumenter-loader',
				exclude: [
					...excludePackageRegExps,
					new RegExp( `${ path.sep }(node_modules|tests|theme|lib)${ path.sep }` ),
				],
				query: {
					esModules: true
				}
			}
		);
	}

	return config;
};
