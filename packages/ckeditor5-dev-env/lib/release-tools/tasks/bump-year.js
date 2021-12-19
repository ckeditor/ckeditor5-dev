/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const fs = require( 'fs' );
const glob = require( 'glob' );
const minimatch = require( 'minimatch' );

/**
 * Updates year in all licenses in the provided directory, based on provided glob patterns.
 *
 * Replaces:
 * 	Copyright (c) [initial year]-xxxx
 *
 * With:
 *	Copyright (c) [initial year]-[current year]
 *
 * @param {Object} params
 * @param {String} params.cwd Current working directory from which all paths will be resolved.
 * @param {Number} params.initialYear Year from which the licenses should begin. Default value is 2003.
 * @param {Array} params.globPatterns array of objects, where each object has string property 'pattern',
 * and optionally 'options' property.
 */
module.exports = function bumpYear( params ) {
	if ( !params.initialYear ) {
		params.initialYear = '2003';
	}

	const filesToUpdate = params.globPatterns
		.map( globPattern => glob.sync( globPattern.pattern, globPattern.options ) )
		.reduce( ( previous, current ) => [ ...previous, ...current ] )
		.filter( fileName => {
			// Filter out directories.
			if ( fs.statSync( fileName ).isDirectory() ) {
				return false;
			}

			// Filter out nested `node_modules`.
			if ( minimatch( fileName, '**/node_modules/**' ) ) {
				return false;
			}

			// Filter out builds.
			if ( minimatch( fileName, '**/build/**' ) ) {
				return false;
			}

			return true;
		} );

	const filesWithoutHeader = [];
	const totalFiles = filesToUpdate.length;
	let updatedFiles = 0;

	filesToUpdate.forEach( fileName => {
		const fileContent = fs.readFileSync( fileName, 'utf-8' );
		const currentYear = new Date().getFullYear();

		// This syntax has to be used in order to insert variable into the regex.
		const yearRegexp = new RegExp( `(?<=Copyright \\(c\\) ${ params.initialYear }-)\\d{4}`, 'gm' );

		let updatedFileContent = fileContent.replace( yearRegexp, currentYear );

		// TODO: Remove this line after all repositories are updated.
		updatedFileContent = updatedFileContent.replace( /- Frederico Knabben/, 'Holding sp. z o.o' );

		// Optional replacing of second line with either longer or shorter version.
		/* Short to long
		updatedFileContent = updatedFileContent.replace(
			/For licensing, see LICENSE\.md\./,
			'For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license'
		); */
		/* Long to short
		updatedFileContent = updatedFileContent.replace(
			/For licensing, see LICENSE\.md or https:\/\/ckeditor\.com\/legal\/ckeditor-oss-license/,
			'For licensing, see LICENSE.md.'
		); */

		if ( fileContent === updatedFileContent ) {
			// License headers are only required in JS files.
			// Also, the file might have already been updated.
			if ( fileName.endsWith( '.js' ) && !fileContent.match( yearRegexp ) ) {
				filesWithoutHeader.push( `${ params.cwd }/${ fileName }` );
			}
		} else {
			fs.writeFileSync( fileName, updatedFileContent, 'utf-8' );
		}

		updatedFiles++;

		const percent = ( ( updatedFiles / totalFiles ) * 100 ).toFixed( 2 );
		const trimmedFileName = fileName.length < 50 ? fileName : '...' + fileName.slice( -47 );

		const output = [
			`[ ${ updatedFiles } / ${ totalFiles } ]`,
			chalk.green( `(${ percent }%)` ),
			chalk.underline( trimmedFileName )
		].join( ' ' );

		process.stdout.clearLine();
		process.stdout.cursorTo( 0 );
		process.stdout.write( output );
	} );

	if ( filesWithoutHeader.length ) {
		console.warn( chalk.red( 'Following files are missing their license headers:' ) );
		for ( const file of filesWithoutHeader ) {
			console.log( file );
		}
	}
};
