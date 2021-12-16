/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
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
 * @param {Boolean} options.diff Instead of list of files, it displays detailed
 * list of changes from each file. Has no effect without options.dryRun.
 */
module.exports = function updatePackageVersions( options ) {
	const execOptions = {
		stdio: 'inherit',
		cwd: options.cwd
	};

	console.log( '\n📍 ' + chalk.blue( 'Updating CKEditor 5 dependencies...\n' ) );

	try {
		const packagesResult = updateDirectory( 'packages', options.cwd );
		console.log( getFeedback( packagesResult ) );

		const releaseResult = updateDirectory( 'release', options.cwd );
		console.log( getFeedback( releaseResult ) );

		if ( packagesResult.updated ) {
			console.log( '\n📍 ' + chalk.blue( 'Committing the changes from \'packages/*\'...\n' ) );

			if ( options.dryRun ) {
				console.log( chalk.yellow( 'DRY RUN mode - no changes will be committed.' ) );

				if ( options.diff ) {
					console.log( 'git diff --word-diff ./packages' );
					execSync( 'git diff --word-diff ./packages', execOptions );
				} else {
					console.log( 'git status --short ./packages' );
					execSync( 'git status --short ./packages', execOptions );
				}

				console.log( chalk.yellow( 'Reverting the changes...' ) );
				execSync( 'git checkout ./packages', execOptions );
			} else {
				execSync( 'git add ./packages', execOptions );
				execSync( 'git commit -m "Internal: Updated all CKEditor 5 dependencies ' +
					'in `packages/*` to the latest version. [skip ci]"', execOptions );
			}
		}

		const totalUpdated = packagesResult.updated + releaseResult.updated;

		if ( totalUpdated ) {
			console.log( '\n📍 ' + chalk.green( `Successfully updated package versions in ${ totalUpdated } files!\n` ) );
		} else {
			console.log( '\n📍 ' + chalk.green( 'No packages needed updating.\n' ) );
		}
	} catch ( error ) {
		console.log( '\n📍 ' + chalk.red( 'Updating package versions threw an error:' ) );
		console.log( chalk.redBright( error ) );
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
 * @returns {Object} True if any files were updated, false otherwise
 */
function updateDirectory( pathToUpdate, cwd ) {
	console.log( `Looking for package.json files in './${ pathToUpdate }'...` );

	const globPattern = pathToUpdate + '/*/package.json';
	const packageJsonArray = glob.sync( globPattern, { cwd } );

	if ( !packageJsonArray.length ) {
		return { found: 0, updated: 0 };
	}

	let updatedFiles = 0;

	for ( const file of packageJsonArray ) {
		const currentFileData = fs.readFileSync( file, 'utf-8' );
		const parsedData = JSON.parse( currentFileData );
		const version = parsedData.version;

		// Update only the cke5 deps except the *-dev ones.
		const regex = /^@ckeditor\/ckeditor5-(?!dev)|^ckeditor5$/;

		for ( const dependency in parsedData.dependencies ) {
			if ( !regex.test( dependency ) ) {
				continue;
			}

			parsedData.dependencies[ dependency ] = version;
		}

		for ( const dependency in parsedData.devDependencies ) {
			if ( !regex.test( dependency ) ) {
				continue;
			}

			parsedData.devDependencies[ dependency ] = version;
		}

		const newFileData = JSON.stringify( parsedData, null, 2 ) + '\n';

		if ( currentFileData !== newFileData ) {
			updatedFiles++;
			fs.writeFileSync( file, newFileData, 'utf-8' );
		}
	}

	return { found: packageJsonArray.length, updated: updatedFiles };
}

/**
 * Generates feedback based on received data.
 *
 * @param {Object} updateResult
 * @param {Number} updateResult.found
 * @param {Number} updateResult.updated
 * @returns {String} Description of what was found and/or updated.
 */
function getFeedback( updateResult ) {
	if ( !updateResult.found ) {
		return 'No files were found.';
	}

	if ( updateResult.found && !updateResult.updated ) {
		return `${ updateResult.found } files were found, but none needed to be updated.`;
	}

	return `Out of ${ updateResult.found } files found, ${ updateResult.updated } were updated.`;
}
