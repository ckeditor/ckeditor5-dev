/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const CKEditorWebpackPlugin = require( '../../ckeditor-webpack-plugin' );
const escapedPathSep = path.sep == '/' ? '/' : '\\\\';

/**
 * @param {Object} options
 * @returns {Object}
 */
module.exports = function getWebpackConfigForAutomatedTests( options ) {
	const config = {
		plugins: [
			new CKEditorWebpackPlugin( {
				packages: {
					'*': path.join( process.cwd(), 'node_modules' )
				}
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
		},

		resolveLoader: {
			modules: [
				path.resolve( __dirname, '..', '..', 'node_modules' )
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
				include: [
					...getPathsToIncludeForCoverage( options.files )
				],
				exclude: [
					new RegExp( `${ escapedPathSep }(lib)${ escapedPathSep }` )
				],
				query: {
					esModules: true
				}
			}
		);
	}

	return config;
};

// Rerturns an array of `/ckeditor5-name\/src\//` regexps based on passed globs.
// e.g. 'ckeditor5-utils/**/*.js' will be converted to /ckeditor5-utils\/src/.
// This loose way of matching packages for CC works with packages under various paths.
// E.g. workspace/ckeditor5-utils and ckeditor5/node_modules/ckeditor5-utils and every other path.
function getPathsToIncludeForCoverage( globs ) {
	return globs
		.map( ( glob ) => {
			const match = glob.match( /\/(ckeditor5-[^\/]+)\// );

			if ( match ) {
				return new RegExp( match[ 1 ] + escapedPathSep + 'src' + escapedPathSep );
			}
		} )
		// Filter undefined ones.
		.filter( path => path );
}
