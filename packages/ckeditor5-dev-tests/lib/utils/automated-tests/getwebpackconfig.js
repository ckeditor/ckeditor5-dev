/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const escapedPathSep = path.sep == '/' ? '/' : '\\\\';
const webpack = require( 'webpack' );
const { getPostCssConfig } = require( '@ckeditor/ckeditor5-dev-utils' ).styles;
const getDefinitionsFromFile = require( '../getdefinitionsfromfile' );

/**
 * @param {Object} options
 * @returns {Object}
 */
module.exports = function getWebpackConfigForAutomatedTests( options ) {
	const definitions = Object.assign( {}, getDefinitionsFromFile( options.identityFile ) );

	const ckDebugLoader = {
		loader: require.resolve( '../ck-debug-loader' ),
		options: {
			debugFlags: options.debug
		}
	};

	const config = {
		mode: 'development',

		watchOptions: {
			aggregateTimeout: 500
		},

		plugins: [
			new webpack.DefinePlugin( definitions ),
			new webpack.ProvidePlugin( {
				process: 'process/browser'
			} )
		],

		resolve: {
			extensions: options.resolveJsFirst ?
				[ '.js', '.ts', '.json' ] :
				[ '.ts', '.js', '.json' ]
		},

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
										themePath: options.themePath
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
					...ckDebugLoader
				},
				{
					test: /\.ts$/,
					use: [
						{
							loader: 'ts-loader',
							options: {
								// Override default settings specified in `tsconfig.json`.
								compilerOptions: {
									// Do not emit any JS file as these TypeScript files are just passed through webpack.
									// Automated tests have a single entry point.
									// See: https://github.com/ckeditor/ckeditor5/issues/12111.
									noEmit: false,
									// Do not emit any file when couldn't compile a TS file.
									// Otherwise, karma prints an error on the top of the output log and then, execute tests.
									// It might give a false positive results. Tests are OK while something could not be compiled.
									// In such a case we would like to throw an error.
									noEmitOnError: true
								}
							}
						}
					]
				}
			]
		},

		resolveLoader: {
			modules: [
				'node_modules',
				path.resolve( __dirname, '..', '..', '..', 'node_modules' )
			]
		},

		output: {
			// Get rid of the "webpack://" protocol to make the paths clickable in the terminal.
			devtoolModuleFilenameTemplate: info => info.resourcePath
		}
	};

	if ( options.sourceMap ) {
		// After bumping the webpack to v5 and other related tools/libs/whatever, the source maps stopped working for unknown reasons.
		// The only way to make them work again was to use the inline source maps.
		//
		// See https://github.com/ckeditor/ckeditor5/issues/11006.
		config.devtool = 'inline-source-map';

		// Since webpack v5 it looks like splitting out the source code into the commons and runtime chunks broke the source map support.
		config.optimization = {
			runtimeChunk: false,
			splitChunks: false
		};
	}

	if ( options.coverage ) {
		config.module.rules.unshift(
			{
				test: /\.[jt]s$/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							plugins: [
								'babel-plugin-istanbul'
							]
						}
					},
					{
						...ckDebugLoader
					}
				],
				include: getPathsToIncludeForCoverage( options.files ),
				exclude: [
					new RegExp( `${ escapedPathSep }(lib)${ escapedPathSep }` )
				]
			}
		);
	} else {
		const tsRules = config.module.rules.find( loader => 'typescript.ts'.match( loader.test ) );
		tsRules.use.push( {
			...ckDebugLoader
		} );
	}

	if ( options.cache ) {
		config.cache = {
			type: 'filesystem'
		};
	}

	return config;
};

// Returns an array of `/ckeditor5-name\/src\//` regexps based on passed globs.
// e.g. 'ckeditor5-utils/**/*.js' will be converted to /ckeditor5-utils\/src/.
// This loose way of matching packages for CC works with packages under various paths.
// E.g. workspace/ckeditor5-utils and ckeditor5/node_modules/ckeditor5-utils and every other path.
function getPathsToIncludeForCoverage( globs ) {
	const values = globs
		.reduce( ( returnedPatterns, globPatterns ) => {
			returnedPatterns.push( ...globPatterns );

			return returnedPatterns;
		}, [] )
		.map( glob => {
			const matchCKEditor5 = glob.match( /\/(ckeditor5-[^/]+)\// );

			if ( matchCKEditor5 ) {
				const packageName = matchCKEditor5[ 1 ]
					// A special case when --files='!engine' or --files='!engine|ui' was passed.
					// Convert it to /ckeditor5-(?!engine)[^/]\/src\//.
					.replace( /ckeditor5-!\(([^)]+)\)\*/, 'ckeditor5-(?!$1)[^' + escapedPathSep + ']+' )
					.replace( 'ckeditor5-*', 'ckeditor5-[a-z]+' );

				return new RegExp( packageName + escapedPathSep + 'src' + escapedPathSep );
			}
		} )
		// Filter undefined ones.
		.filter( path => path );

	return [ ...new Set( values ) ];
}
