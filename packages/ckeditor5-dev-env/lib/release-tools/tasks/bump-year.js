/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const glob = require( 'glob' );
const minimatch = require( 'minimatch' );

/**
 * See https://github.com/ckeditor/ckeditor5/issues/10909
 *
 * @param {Object} params
 * @param {String} params.cwd Current working directory from which all paths will be resolved
 * @param {Function} params.callback Optional function to modify the license header
 * @param {Number} params.initialYear Year from which the licenses should begin
 * @param {Array} params.globPatterns array of objects, where each object has string property 'pattern',
 * and optionally 'options' property.
 */
module.exports = function bumpYear( params ) {
	params.globPatterns
		.map( globPattern => glob.sync( globPattern.pattern, globPattern.options ) )
		.reduce( ( previous, current ) => [ ...previous, ...current ] )
		.filter( fileName => {
			// Filter out nested `node_modules`.
			if ( minimatch( fileName, '**/node_modules/**' ) ) {
				return false;
			}

			// Filter out stuff from `src/lib/`.
			if ( minimatch( fileName, '**/src/lib/**' ) ) {
				return false;
			}

			// Filter out builds.
			if ( minimatch( fileName, '**/ckeditor5-build-*/**' ) ||
				minimatch( fileName, '**/build/**' ) ) {
				return false;
			}

			// Filter out directories.
			if ( fs.statSync( fileName ).isDirectory() ) {
				return false;
			}

			return true;
		} )
		.forEach( fileName => {
			const currentYear = new Date().getFullYear();
			const yearOnlyRegexp = /(?<=^\/\*\*$[\s\S]+^ \* @license.+)(\d{4}-\d{4})(?=[\s\S]+^ \*\/$)/m;
			const fullLicenseRegexp = /^\/\*\*$[\s\S]+^ \* @license.+\d{4}-\d{4}[\s\S]+^ \*\/$/m;

			const fileContent = fs.readFileSync( fileName, 'utf-8' );

			let updatedFileContent = fileContent.replace( yearOnlyRegexp, `${ params.initialYear }-${ currentYear }` );

			if ( params.callback ) {
				updatedFileContent = updatedFileContent.replace( fullLicenseRegexp, params.callback );
			}

			if ( fileContent === updatedFileContent ) {
			// License headers are only required in JS files.
			// Also, the file might have already been updated.
				if ( fileName.endsWith( '.js' ) && !fileContent.match( yearOnlyRegexp ) ) {
					console.warn( `The file "${ params.cwd }/${ fileName }" misses a license header.` );
				}
			} else {
				fs.writeFileSync( fileName, updatedFileContent, 'utf-8' );
			}
		} );
};
