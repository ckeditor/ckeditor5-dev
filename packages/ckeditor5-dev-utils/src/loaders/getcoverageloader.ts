/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';

type CoverageLoaderConfig = {
	test: RegExp;
	use: Array<{
		loader: string;
		options: {
			plugins: Array<string>;
		};
	}>;
	include: Array<RegExp>;
	exclude: Array<RegExp>;
};

const escapedPathSep = path.sep == '/' ? '/' : '\\\\';

/**
 * @param {object} options]
 * @param {Array.<string>} options.files
 * @returns {object}
 */
export default function getCoverageLoader( { files }: { files: Array<string> } ): CoverageLoaderConfig {
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
 * Returns an array of `/ckeditor5-name\/src\//` regexps based on passed globs.
 * E.g., `ckeditor5-utils/**\/*.js` will be converted to `/ckeditor5-utils\/src/`.
 *
 * This loose way of matching packages for CC works with packages under various paths.
 * E.g., `workspace/ckeditor5-utils` and `ckeditor5/node_modules/ckeditor5-utils` and every other path.
 *
 * @param {Array.<string>} globs
 * @returns {Array.<string>}
 */
function getPathsToIncludeForCoverage( globs: Array<string> ): Array<RegExp> {
	const values = globs
		.reduce( ( returnedPatterns, globPatterns ) => {
			returnedPatterns.push( ...globPatterns );

			return returnedPatterns;
		}, [] as Array<string> )
		.map( glob => {
			const matchCKEditor5 = glob.match( /\/(ckeditor5-[^/]+)\/(?!.*ckeditor5-)/ );

			if ( matchCKEditor5 ) {
				const packageName = matchCKEditor5[ 1 ]!
					// A special case when --files='!engine' or --files='!engine|ui' was passed.
					// Convert it to /ckeditor5-(?!engine)[^/]\/src\//.
					.replace( /ckeditor5-!\(([^)]+)\)\*/, 'ckeditor5-(?!$1)[^' + escapedPathSep + ']+' )
					.replace( 'ckeditor5-*', 'ckeditor5-[a-z]+' );

				return new RegExp( packageName + escapedPathSep + 'src' + escapedPathSep );
			}
		} )
		// Filter undefined ones.
		.filter( path => path );

	return [ ...new Set( values as Array<RegExp> ) ];
}
