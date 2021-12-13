/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const glob = require( 'glob' );

module.exports = function updatePackageVersions( pathToUpdate ) {
	const pathToCheck = pathToUpdate + '/**/package.json';

	console.log( `Looking for package.json files in ${ pathToCheck }...` );

	const packageJsonArray = glob.sync( pathToCheck ).filter( path => !path.includes( '/node_modules/' ) );

	console.log( `Found ${ packageJsonArray.length } files.` );

	console.log( 'Updating ckeditor5 dependencies...' );

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
};
