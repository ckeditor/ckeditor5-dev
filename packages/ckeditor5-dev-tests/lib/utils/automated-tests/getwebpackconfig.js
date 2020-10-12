/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const escapedPathSep = path.sep == '/' ? '/' : '\\\\';
const { getPostCssConfig } = require( '@ckeditor/ckeditor5-dev-utils' ).styles;

/**
 * @param {Object} options
 * @returns {Object}
 */
module.exports = function getWebpackConfigForAutomatedTests( options ) {
	const config = {
		mode: 'development',

		module: {
			rules: [
				{
					// test: **/ckeditor5-*/theme/icons/*.svg
					test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
					use: [ 'raw-loader' ]
				},
				{
					// test: **/ckeditor5-*/theme/**/*.css
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
										themePath: getThemePath( options )
									},
									minify: true
								} )
							}
						}
					]
				},
				{
					test: /\.(txt|html|rtf)$/,
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

	if ( options.sourceMap ) {
		// Note: karma-sourcemap-loader works only with inline source maps.
		// See https://github.com/webpack/karma-webpack/pull/76.
		// We use cheap source maps for manual tests because Safari
		// had problems with inline source maps and ES6. This means that
		// you can't have source maps in automated tests in Safari.
		config.devtool = 'inline-source-map';
	}

	if ( options.coverage ) {
		config.module.rules.unshift(
			{
				test: /\.js$/,
				loader: 'istanbul-instrumenter-loader',
				include: getPathsToIncludeForCoverage( options.files ),
				exclude: [
					new RegExp( `${ escapedPathSep }(lib)${ escapedPathSep }` )
				],
				options: {
					esModules: true
				}
			}
		);
	}

	return config;
};

// Returns an array of `/ckeditor5-name\/src\//` regexps based on passed globs.
// e.g. 'ckeditor5-utils/**/*.js' will be converted to /ckeditor5-utils\/src/.
// This loose way of matching packages for CC works with packages under various paths.
// E.g. workspace/ckeditor5-utils and ckeditor5/node_modules/ckeditor5-utils and every other path.
function getPathsToIncludeForCoverage( globs ) {
	return globs
		.reduce( ( returnedPatterns, globPatterns ) => {
			returnedPatterns.push( ...globPatterns );

			return returnedPatterns;
		}, [] )
		.map( glob => {
			const matchCKEditor5 = glob.match( /\/(ckeditor5-[^/]+)\// );
			const matchCKEditor = glob.match( /\/(ckeditor-[^/]+)\// );

			if ( matchCKEditor5 ) {
				const packageName = matchCKEditor5[ 1 ]
					// A special case when --files='!engine' or --files='!engine|ui' was passed.
					// Convert it to /ckeditor5-(?!engine)[^/]\/src\//.
					.replace( /ckeditor5-!\(([^)]+)\)\*/, 'ckeditor5-(?!$1)[^' + escapedPathSep + ']+' )
					.replace( 'ckeditor5-*', 'ckeditor5-[a-z]+' );

				return new RegExp( packageName + escapedPathSep + 'src' + escapedPathSep );
			} else if ( matchCKEditor ) {
				const packageName = matchCKEditor[ 1 ]
					.replace( /ckeditor-!\(([^)]+)\)\*/, 'ckeditor-(?!$1)[^' + escapedPathSep + ']+' )
					.replace( 'ckeditor-*', 'ckeditor-[a-z]+' );

				return new RegExp( packageName + escapedPathSep + 'src' + escapedPathSep );
			}
		} )
		// Filter undefined ones.
		.filter( path => path );
}

function getThemePath( options ) {
	if ( options.themePath ) {
		return options.themePath;
	}

	const themePackagePath = path.join( process.cwd(), 'node_modules', '@ckeditor/ckeditor5-theme-lark' );
	const themePackageJson = require( path.join( themePackagePath, 'package.json' ) );

	return path.join( themePackagePath, themePackageJson.main );
}
