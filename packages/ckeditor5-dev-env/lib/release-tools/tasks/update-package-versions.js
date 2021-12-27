/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { diffLines: diff } = require( 'diff' );
const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const glob = require( 'glob' );
const readline = require( 'readline' );
const { sep, posix } = require( 'path' );

/**
 * For all directories passed as an argument, all `@ckeditor/ckeditor5-*` and `ckeditor5` dependencies will be updated to the latest
 * version. If `commit: true` is added, changes will be committed as well.
 *
 * See https://github.com/cksource/ckeditor5-internal/issues/1123
 *
 * @param {Array<Object>} pathsToUpdate Array of objects, where each object needs to have `path` value with an absolute path to the
 * repository that is to be updated, as well as optional `commit` flag, that when set to true, will commit the changes from that path.
 * @param {Boolean} dryRun Prevents the script from committing or changing anything, and instead shows list of files that would be
 * changed.
 */
module.exports = function updatePackageVersions( pathsToUpdate, dryRun ) {
	const totalResult = { found: 0, updated: 0, toCommit: 0, differences: [] };
	const pathsToCommit = [];

	console.log( '\n📍 ' + chalk.blue( 'Updating CKEditor 5 dependencies...\n' ) );

	for ( const pathToUpdate of pathsToUpdate ) {
		const path = pathToUpdate.path.split( sep ).join( posix.sep );

		console.log( `Looking for package.json files in '${ path }'...` );

		const result = updateDirectory( path, dryRun );

		totalResult.found += result.found;
		totalResult.updated += result.updated;

		if ( result.differences ) {
			totalResult.differences.push( ...result.differences );
		}

		if ( !result.found ) {
			console.log( 'No files were found.\n' );
		} else if ( !result.updated ) {
			console.log( `${ chalk.bold( result.found ) } files were found, but none needed to be updated.\n` );
		} else {
			console.log( `Out of ${ chalk.bold( result.found ) } files found, ${ chalk.bold( result.updated ) } were updated.\n` );

			if ( pathToUpdate.commit ) {
				totalResult.toCommit += result.updated;
				pathsToCommit.push( path );
			}
		}
	}

	if ( dryRun ) {
		console.log( chalk.yellow( 'DRY RUN mode - press any key to display next file diff, or Q to exit.' ) );

		if ( !totalResult.differences.length ) {
			console.log( chalk.yellow( 'The script has not changed any files.' ) );
			process.exit();
		}

		readline.emitKeypressEvents( process.stdin );
		process.stdin.setRawMode( true );

		process.stdin.on( 'keypress', ( str, key ) => {
			if ( key.name === 'q' ) {
				console.log( chalk.yellow( 'Manual exit.' ) );
				process.exit();
			}

			const nextDiff = totalResult.differences.shift();
			const formattedDiff = formatDiff( nextDiff.content );

			console.log( chalk.underline( nextDiff.file ) );

			for ( const line of formattedDiff ) {
				console.log( line );
			}

			if ( !totalResult.differences.length ) {
				console.log( chalk.yellow( 'No more files.' ) );
				process.exit();
			}

			console.log( chalk.yellow( 'Any key - Next | Q - Exit' ) );
		} );
	} else {
		if ( pathsToCommit.length ) {
			console.log( '\n📍 ' + chalk.blue( 'Committing the changes...\n' ) );

			for ( const path of pathsToCommit ) {
				const execOptions = {
					stdio: 'inherit',
					cwd: path
				};

				console.log( `${ chalk.green( '+' ) } ${ path }` );

				execSync( `git add ${ path }`, execOptions );
				execSync( 'git commit -m "Internal: Updated all CKEditor 5 dependencies ' +
				'in `packages/*` to the latest version. [skip ci]"', execOptions );
			}

			console.log( '\n📍 ' + chalk.green( `Successfully committed ${ totalResult.toCommit } files!\n` ) );
		}

		if ( totalResult.updated ) {
			console.log( '\n📍 ' + chalk.green( `Updated total of ${ totalResult.updated } files!\n` ) );
		} else {
			console.log( '\n📍 ' + chalk.green( 'No files needed an update.\n' ) );
		}
	}
};

/**
 * Updates `@ckeditor/ckeditor5-*` and `ckeditor5` dependencies in the specified directory to the latest version.
 * Latest version is taken from the `version` property from the root of the `package.json` file, since that value
 * should already have been bumped at this point of release process.
 *
 * @param {String} pathToUpdate Directory containing files to update.
 * @param {Boolean} dryRun If set to true, diff of changes that would be made is calculated, and included in the returned object. Without
 * this flag, file is updated normally.
 * @returns {updateResult}
 */
function updateDirectory( pathToUpdate, dryRun ) {
	const globPattern = pathToUpdate + '/*/package.json';
	const packageJsonArray = glob.sync( globPattern );

	if ( !packageJsonArray.length ) {
		return { found: 0, updated: 0, differences: [] };
	}

	let updatedFiles = 0;
	const differences = [];

	for ( const file of packageJsonArray ) {
		const currentFileData = fs.readFileSync( file, 'utf-8' );
		const parsedData = JSON.parse( currentFileData );

		updateObjectProperty( parsedData, 'dependencies' );
		updateObjectProperty( parsedData, 'devDependencies' );

		const newFileData = JSON.stringify( parsedData, null, 2 ) + '\n';

		if ( currentFileData !== newFileData ) {
			updatedFiles++;

			if ( dryRun ) {
				differences.push( {
					file,
					content: diff( currentFileData, newFileData, { newlineIsToken: true } )
				} );
			} else {
				fs.writeFileSync( file, newFileData, 'utf-8' );
			}
		}
	}

	return { found: packageJsonArray.length, updated: updatedFiles, differences };
}

/**
 * Updates the CKEditor 5 dependencies, except the `*-dev` and `*-inspector` ones, in the provided `package.json` file.
 *
 * @param {Object} parsedPkgJson Object to update.
 * @param {String} propertyName Name of the property to update.
 */
function updateObjectProperty( parsedPkgJson, propertyName ) {
	// Update only the CKEditor 5 dependencies, except the *-dev and *-inspector.
	const regex = /^@ckeditor\/ckeditor5-(?!dev|inspector)|^ckeditor5$/;
	const version = parsedPkgJson.version;

	for ( const dependency in parsedPkgJson[ propertyName ] ) {
		if ( !regex.test( dependency ) ) {
			continue;
		}

		parsedPkgJson[ propertyName ][ dependency ] = `^${ version }`;
	}
}

/**
 * Takes in raw changelog for a single file generated by `diff` library, and returns formatted array of strings, containing
 * human-readable, line by line changelog of a file, with removals and additions colored. If the file has any longer parts without changes,
 * these will be partially hidden.
 *
 * @param {Array<Object>} diff Array of changes for a single file generated by `diff` library.
 * @returns {Array<String>} Formatted changelog split into single lines.
 */
function formatDiff( diff ) {
	const formattedDiff = [];
	const regex = /(?<=":) (?=")/;

	for ( let i = 0; i < diff.length; i++ ) {
		const current = diff[ i ];
		const next = diff[ i + 1 ];
		const currentLines = current.value.split( '\n' );

		const validReplaceSequence = current.removed && next.added && regex.test( current.value ) && regex.test( next.value );

		if ( validReplaceSequence ) {
			// Adding removals followed by additions (formatted).
			formattedDiff.push( [
				current.value.split( regex )[ 0 ],
				' ',
				chalk.red( current.value.split( regex )[ 1 ] ),
				chalk.green( next.value.split( regex )[ 1 ] )
			].join( '' ) );

			i++;
		} else if ( !current.added && !current.removed && currentLines.length > 8 ) {
			// Cutting out the middle of a long streak of unchanged lines.
			const shortenedLines = [
				...currentLines.slice( 0, 3 ),
				chalk.gray( `[...${ currentLines.length - 7 } lines without changes...]` ),
				...currentLines.slice( -4 )
			].join( '\n' );

			formattedDiff.push( shortenedLines );
		} else {
			// Adding everything else that does not need formatting.
			formattedDiff.push( current.value );
		}
	}

	// This turns the array from random chunks containing newlines, to uniform set of single lines.
	return formattedDiff.join( '' ).split( '\n' );
}

/**
 * Contains information about the way in which the files were processed.
 *
 * @typedef {Object} updateResult
 * @property {Number} found amount of files found
 * @property {Number} updated amount of files updated
 * @property {Array<Object>} differences array of objects, where each object has string `file` containing path to the file, as well as
 * array of objects `content` returned by the `diff` library, that describes changes made to each file.
 */
