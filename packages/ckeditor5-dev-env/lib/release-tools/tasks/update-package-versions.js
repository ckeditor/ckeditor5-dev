/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const fs = require( 'fs' );
const glob = require( 'glob' );
const path = require( 'path' );

module.exports = function updatePackageVersions( options ) {
	console.log( '\n🔹 ' + chalk.blue( 'Updating package versions...' ) );

	const pathToPackages = path.posix.join( options.cwd, 'packages' );
	const pathToRelease = path.posix.join( options.cwd, 'release' );

	try {
		updateDirectory( pathToPackages );
		updateDirectory( pathToRelease );

		console.log( '\n✔️  ' + chalk.green( 'Successfully updated package versions!' ) );
	} catch ( error ) {
		console.log( '\n❌ ' + chalk.red( 'Updating package versions threw an error:' ) );
		console.log( chalk.redBright( error ) );
	}
};

function updateDirectory( pathToUpdate ) {
	const pathToCheck = pathToUpdate + '/**/package.json';

	console.log( `\nLooking for package.json files in ${ pathToCheck }...` );

	const packageJsonArray = glob.sync( pathToCheck ).filter( path => !path.includes( 'node_modules' ) );

	if ( !packageJsonArray.length ) {
		console.log( 'No files were found.' );
		return;
	}

	console.log( `Found ${ packageJsonArray.length } files. Updating ckeditor5 dependencies...` );

	for ( const file of packageJsonArray ) {
		const fileData = fs.readFileSync( file, 'utf-8' );
		const parsedData = JSON.parse( fileData );
		const version = parsedData.version;

		for ( const dependency in parsedData.dependencies ) {
			// Update only cke5 deps except the *-dev ones.
			if ( !/^@ckeditor\/ckeditor5-(?!dev)|^ckeditor5-(?!dev)/.test( dependency ) ) {
				continue;
			}

			parsedData.dependencies[ dependency ] = version;
		}

		fs.writeFileSync( file, JSON.stringify( parsedData, null, 2 ) + '\n', 'utf-8' );
	}

	console.log( `Successfully updated dependencies in ${ packageJsonArray.length } files!` );
}
