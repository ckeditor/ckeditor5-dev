/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { diffChars: diff } = require( 'diff' );
const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const glob = require( 'glob' );

/**
 * Updates `@ckeditor/ckeditor5-*` and `ckeditor5` dependencies in `packages/*` and `release/*`
 * directories to the latest version. Changes in `packages/*` will be committed as well.
 *
 * See https://github.com/cksource/ckeditor5-internal/issues/1123
 *
 * @param {Object} options
 * @param {String} options.cwd The root directory of the repository in which
 * the script is being used.
 * @param {Boolean} options.dryRun Prevents the script from committing, and
 * instead shows list of files that was changed in `packages/*` directory.
 * @param {Boolean} options.pathsToUpdate Instead of list of files, it displays detailed
 * list of changes from each file. Has no effect without options.dryRun.
 */
module.exports = function updatePackageVersions( options ) {
	const totalResult = { found: 0, updated: 0, differences: [] };
	const pathsToCommit = [];

	options.pathsToUpdate.forEach( ( value, index, array ) => {
		array[ index ].path = value.path.split( '\u005C' ).join( '\u002F' );
	} );

	console.log( '\n📍 ' + chalk.blue( 'Updating CKEditor 5 dependencies...\n' ) );

	for ( const pathToUpdate of options.pathsToUpdate ) {
		console.log( `Looking for package.json files in '${ pathToUpdate.path }'...` );

		const result = updateDirectory( pathToUpdate.path, options.cwd, options.dryRun );

		totalResult.found += result.found;
		totalResult.updated += result.updated;
		if ( result.differences ) {
			totalResult.differences = [ ...totalResult.differences, ...result.differences ];
		}

		if ( !result.found ) {
			console.log( 'No files were found.\n' );
		} else if ( result.found && !result.updated ) {
			console.log( `${ chalk.bold( result.found ) } files were found, but none needed to be updated.\n` );
		} else {
			console.log( `Out of ${ chalk.bold( result.found ) } files found, ${ chalk.bold( result.updated ) } were updated.\n` );

			if ( pathToUpdate.commit ) {
				pathsToCommit.push( pathToUpdate.path );
			}
		}
	}

	if ( options.dryRun ) {
		console.log( chalk.yellow( 'DRY RUN mode - displaying changes instead of committing.' ) );

		// TODO: Changes will be displayed here
		console.log( totalResult );
	} else if ( pathsToCommit.length ) {
		console.log( '\n📍 ' + chalk.blue( 'Committing the changes...\n' ) );

		for ( const path of pathsToCommit ) {
			const execOptions = {
				stdio: 'inherit',
				cwd: path
			};

			console.log( chalk.blue( path ) );
			execSync( `git add ${ path }`, execOptions );
			execSync( 'git commit -m "Internal: Updated all CKEditor 5 dependencies ' +
				'in `packages/*` to the latest version. [skip ci]"', execOptions );
		}

		console.log( '\n📍 ' + chalk.green( `Successfully committed ${ pathsToCommit.length } files!\n` ) );
	}

	if ( totalResult.updated ) {
		console.log( '\n📍 ' + chalk.green( `Updated total of ${ totalResult.updated } files!\n` ) );
	} else {
		console.log( '\n📍 ' + chalk.green( 'No files needed an update.\n' ) );
	}
};

/**
 * Updates `@ckeditor/ckeditor5-*` and `ckeditor5` dependencies in the specified directory to the latest version.
 * Latest version is taken from the `version` property from the root of the `package.json` file, since that value
 * should already have been bumped at this point of release process.
 *
 * @param {String} pathToUpdate directory containing files to update
 * @param {String} cwd The root directory of the repository in which
 * the script is being used.
 * @returns {Object} Object containing numerical values counting files found and updated, as well as array of all changes made.
 */
function updateDirectory( pathToUpdate, cwd, dryRun ) {
	const globPattern = pathToUpdate + '/*/package.json';
	const packageJsonArray = glob.sync( globPattern, { cwd } );

	if ( !packageJsonArray.length ) {
		return { found: 0, updated: 0 };
	}

	let updatedFiles = 0;
	const differences = [];

	for ( const file of packageJsonArray ) {
		const currentFileData = fs.readFileSync( file, 'utf-8' );
		const parsedData = JSON.parse( currentFileData );
		const version = parsedData.version;

		// Update only the CKEditor 5 dependencies, except the *-dev and *-inspector.
		const regex = /^@ckeditor\/ckeditor5-(?!dev|inspector)|^ckeditor5$/;

		for ( const dependency in parsedData.dependencies ) {
			if ( !regex.test( dependency ) ) {
				continue;
			}

			parsedData.dependencies[ dependency ] = `^${ version }`;
		}

		for ( const dependency in parsedData.devDependencies ) {
			if ( !regex.test( dependency ) ) {
				continue;
			}

			parsedData.devDependencies[ dependency ] = `^${ version }`;
		}

		const newFileData = JSON.stringify( parsedData, null, 2 ) + '\n';

		if ( currentFileData !== newFileData ) {
			updatedFiles++;
			differences.push( diff( currentFileData, newFileData ) );

			if ( !dryRun ) {
				fs.writeFileSync( file, newFileData, 'utf-8' );
			}
		}
	}

	return { found: packageJsonArray.length, updated: updatedFiles, differences };
}
