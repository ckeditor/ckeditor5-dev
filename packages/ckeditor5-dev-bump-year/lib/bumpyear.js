/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const fs = require( 'fs' );
const glob = require( 'glob' );

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
 * @param {Array} params.globPatterns An array of objects, where each object has string property `pattern`,
 * and optionally `options` property for this `glob` pattern.
 * @param {String} [params.initialYear='2003'] Year from which the licenses should begin.
 */
module.exports = function bumpYear( params ) {
	if ( !params.initialYear ) {
		params.initialYear = '2003';
	}

	console.log( chalk.cyan( 'Looking for files to update...' ) );

	const filesToUpdate = params.globPatterns
		.map( globPattern => {
			const options = globPattern.options || {};

			const defaultIgnore = [
				'**/node_modules/**'
			];

			options.nodir = true;
			options.ignore = options.ignore ? [ ...options.ignore, ...defaultIgnore ] : defaultIgnore;

			return glob.sync( globPattern.pattern, options );
		} )
		.reduce( ( previous, current ) => [ ...previous, ...current ] );

	console.log( chalk.cyan( 'Updating the files...' ) );

	const currentYear = new Date().getFullYear();
	const filesWithoutHeader = [];
	const totalFiles = filesToUpdate.length;
	let updatedFiles = 0;

	filesToUpdate.forEach( fileName => {
		const fileContent = fs.readFileSync( fileName, 'utf-8' );
		const yearRegexp = new RegExp( `(?<=Copyright (?:\\(c\\)|©) ${ params.initialYear }-)\\d{4}`, 'g' );

		const updatedFileContent = fileContent.replace( yearRegexp, currentYear );

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
			`[${ updatedFiles }/${ totalFiles }]`,
			chalk.magenta( `(${ percent }%)` ),
			`Processing: ${ chalk.underline( trimmedFileName ) }`
		].join( ' ' );

		process.stdout.clearLine( 1 );
		process.stdout.cursorTo( 0 );
		process.stdout.write( output );
	} );

	console.log( '\n' + chalk.green( 'Done.' ) );

	if ( filesWithoutHeader.length ) {
		console.warn( chalk.red( 'Following files are missing their license headers:' ) );

		for ( const file of filesWithoutHeader ) {
			console.log( file );
		}
	}
};
