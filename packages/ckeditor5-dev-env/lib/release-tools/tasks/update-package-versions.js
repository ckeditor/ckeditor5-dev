/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const glob = require( 'glob' );
const path = require( 'path' );

/**
 * Updates `@ckeditor/ckeditor5-*` and `ckeditor5` dependencies in `packages/*` and `release/*` directories to the latest version.
 * Changes in `packages/*` will be committed as well.
 *
 * See https://github.com/cksource/ckeditor5-internal/issues/1123
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {Boolean} options.dryRun If set to true, commit of changes to the dependencies in `packages/*` will be reversed.
 *
 * @returns {Promise}
 */
module.exports = function updatePackageVersions( options ) {
	const pathToPackages = path.posix.join( options.cwd, 'packages' );
	const pathToRelease = path.posix.join( options.cwd, 'release' );

	const execOptions = {
		stdio: 'inherit',
		cwd: options.cwd
	};

	try {
		console.log( '\n📍 ' + chalk.blue( 'Updating \'packages/*\'...' ) );
		const packagesChanged = updateDirectory( pathToPackages );

		if ( packagesChanged ) {
			console.log( '\n📍 ' + chalk.blue( 'Committing the changes...\n' ) );

			execSync( 'git add -A', execOptions );
			execSync( 'git commit -m "Updated all ckeditor5 dependencies in `packages/*` to the latest version."', execOptions );
		}

		console.log( '\n📍 ' + chalk.blue( 'Updating \'release/*\'...' ) );
		updateDirectory( pathToRelease );

		console.log( '\n📍 ' + chalk.green( 'Successfully updated package versions!' ) );

		if ( packagesChanged && options.dryRun ) {
			console.log( '\n📍 ' + chalk.yellow( 'DRY RUN mode - Reverting the commit.\n' ) );

			execSync( 'git reset --mixed HEAD~1', execOptions );

			console.log( `\n${ chalk.yellow( 'Use' ) } git checkout . ${ chalk.yellow( 'to revert the changes.\n' ) }` );
		}
	} catch ( error ) {
		console.log( '\n📍 ' + chalk.red( 'Updating package versions threw an error:' ) );
		console.log( chalk.redBright( error ) );
	}
};

/**
 * Updates @ckeditor/ckeditor5-* and ckeditor5 dependencies in the specified directory to the latest version.
 *
 * @param {String} pathToUpdate
 * @returns {Boolean} True if any files were updated, false otherwise
 */
function updateDirectory( pathToUpdate ) {
	const pathToCheck = pathToUpdate + '/**/package.json';

	console.log( `\nLooking for package.json files in ${ pathToCheck }...` );

	const packageJsonArray = glob.sync( pathToCheck ).filter( path => !path.includes( 'node_modules' ) );

	if ( !packageJsonArray.length ) {
		console.log( 'No files were found.' );
		return false;
	}

	console.log( `Found ${ packageJsonArray.length } files. Updating ckeditor5 dependencies...` );

	for ( const file of packageJsonArray ) {
		const currentFileData = fs.readFileSync( file, 'utf-8' );
		const parsedData = JSON.parse( currentFileData );
		const version = parsedData.version;

		for ( const dependency in parsedData.dependencies ) {
			// Update only cke5 deps except the *-dev ones.
			if ( !/^@ckeditor\/ckeditor5-(?!dev)|^ckeditor5-(?!dev)/.test( dependency ) ) {
				continue;
			}

			parsedData.dependencies[ dependency ] = version;
		}

		const newFileData = JSON.stringify( parsedData, null, 2 ) + '\n';
		fs.writeFileSync( file, newFileData, 'utf-8' );
	}

	console.log( `Successfully updated dependencies in ${ packageJsonArray.length } files!` );

	return true;
}
