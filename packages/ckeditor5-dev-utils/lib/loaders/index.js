/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { getPostCssConfig } from '../styles/index.js';

const escapedPathSep = path.sep == '/' ? '/' : '\\\\';

/**
 * @param {Object} [options]
 * @param {String} [options.configFile]
 * @param {Array.<String>} [options.debugFlags]
 * @param {Boolean} [options.includeDebugLoader]
 * @returns {Object}
 */
export function getTypeScriptLoader( options = {} ) {
	const {
		configFile = 'tsconfig.json',
		debugFlags = [],
		includeDebugLoader = false
	} = options;

	return {
		test: /\.ts$/,
		use: [
			{
				loader: 'esbuild-loader',
				options: {
					target: 'es2022',
					tsconfig: configFile
				}
			},
			includeDebugLoader ? getDebugLoader( debugFlags ) : null
		].filter( Boolean )
	};
}

/**
 * @param {Object} options
 * @param {Array.<String>} options.debugFlags
 * @returns {Object}
 */
export function getJavaScriptLoader( { debugFlags } ) {
	return {
		test: /\.js$/,
		...getDebugLoader( debugFlags )
	};
}

/**
 * @param {Object} options
 * @param {String} options.themePath
 * @param {Boolean} [options.minify]
 * @param {Boolean} [options.sourceMap]
 * @param {Boolean} [options.extractToSeparateFile]
 * @param {Boolean} [options.skipPostCssLoader]
 * @returns {Object}
 */
export function getStylesLoader( options ) {
	const {
		themePath,
		minify = false,
		sourceMap = false,
		extractToSeparateFile = false,
		skipPostCssLoader = false
	} = options;

	const getBundledLoader = () => ( {
		loader: 'style-loader',
		options: {
			injectType: 'singletonStyleTag',
			attributes: {
				'data-cke': true
			}
		}
	} );

	const getExtractedLoader = () => {
		return MiniCssExtractPlugin.loader;
	};

	return {
		test: /\.css$/,
		use: [
			extractToSeparateFile ? getExtractedLoader() : getBundledLoader(),
			'css-loader',
			skipPostCssLoader ? null : {
				loader: 'postcss-loader',
				options: {
					postcssOptions: getPostCssConfig( {
						themeImporter: { themePath },
						minify,
						sourceMap
					} )
				}
			}
		].filter( Boolean )
	};
}

/**
 * @param {Object} [options]
 * @param {Boolean} [options.matchExtensionOnly]
 * @returns {Object}
 */
export function getIconsLoader( { matchExtensionOnly = false } = {} ) {
	return {
		test: matchExtensionOnly ? /\.svg$/ : /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
		use: [ 'raw-loader' ]
	};
}

/**
 * @returns {Object}
 */
export function getFormattedTextLoader() {
	return {
		test: /\.(txt|html|rtf)$/,
		use: [ 'raw-loader' ]
	};
}

/**
 * @param {Object} options]
 * @param {Array.<String>} options.files
 * @returns {Object}
 */
export function getCoverageLoader( { files } ) {
	return {
		test: /\.[jt]s$/,
		use: [
			{
				loader: 'babel-loader',
				options: {
					plugins: [
						'babel-plugin-istanbul'
					]
				}
			}
		],
		include: getPathsToIncludeForCoverage( files ),
		exclude: [
			new RegExp( `${ escapedPathSep }(lib)${ escapedPathSep }` )
		]
	};
}
/**
 * @param {Array.<String>} debugFlags
 * @returns {Object}
 */
function getDebugLoader( debugFlags ) {
	return {
		loader: path.join( __dirname, 'ck-debug-loader' ),
		options: { debugFlags }
	};
}

/**
 * Returns an array of `/ckeditor5-name\/src\//` regexps based on passed globs.
 * E.g., `ckeditor5-utils/**\/*.js` will be converted to `/ckeditor5-utils\/src/`.
 *
 * This loose way of matching packages for CC works with packages under various paths.
 * E.g., `workspace/ckeditor5-utils` and `ckeditor5/node_modules/ckeditor5-utils` and every other path.
 *
 * @param {Array.<String>} globs
 * @returns {Array.<String>}
 */
function getPathsToIncludeForCoverage( globs ) {
	const values = globs
		.reduce( ( returnedPatterns, globPatterns ) => {
			returnedPatterns.push( ...globPatterns );

			return returnedPatterns;
		}, [] )
		.map( glob => {
			const matchCKEditor5 = glob.match( /\/(ckeditor5-[^/]+)\/(?!.*ckeditor5-)/ );

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
