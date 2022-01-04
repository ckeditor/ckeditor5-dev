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
const { posix } = require( 'path' );
const readline = require( 'readline' );

/**
 * For all directories passed as an argument, all `@ckeditor/ckeditor5-*` and `ckeditor5` dependencies (with the exception of `-dev`,
 * `-inspector`, `-react`, `-vue` and `-angular`) will be updated to the latest version. If `commit: true` is added, changes
 * will be committed as well.
 *
 * @param {Object} options
 * @param {String} options.version Target version, to which all of the eligible dependencies will be updated to.
 * @param {Array<Object>} options.packages Array of objects, where each object needs to have `path` value with an absolute path to the
 * repository that is to be updated, as well as optional `commit` flag, that when set to true, will commit the changes from that path.
 * @param {Boolean} options.dryRun Prevents the script from committing or changing anything, and instead shows list of files that would be
 * changed.
 */
module.exports = function updateCKEditor5Dependencies( options ) {
	const totalResult = { found: 0, updated: 0, toCommit: 0, differences: [] };
	const pathsToCommit = [];

	console.log( '\n📍 ' + chalk.blue( 'Updating CKEditor 5 dependencies...\n' ) );

	for ( const pathToUpdate of options.packages ) {
		const path = pathToUpdate.path.split( /[/\\]/ ).join( posix.sep );

		console.log( `Looking for packages in '${ chalk.underline( path ) }'...` );

		const result = updateDirectory( options.version, path, options.dryRun );

		totalResult.found += result.found;
		totalResult.updated += result.updated;
		totalResult.differences.push( ...result.differences );

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

	if ( options.dryRun ) {
		console.log( `⚠️ ${ chalk.yellow( 'DRY RUN mode' ) } ⚠️` );
		console.log( chalk.yellow( `${ chalk.bold( 'Enter' ) } / ${ chalk.bold( 'Space' ) } - Display next file diff` ) );
		console.log( chalk.yellow( `            ${ chalk.bold( 'A' ) } - Display diff from all files` ) );
		console.log( chalk.yellow( `      ${ chalk.bold( 'Esc' ) } / ${ chalk.bold( 'Q' ) } - Exit` ) );

		if ( !totalResult.differences.length ) {
			console.log( chalk.yellow( 'The script has not changed any files.' ) );
			process.exit();
		}

		readline.emitKeypressEvents( process.stdin );
		process.stdin.setRawMode( true );

		// Instead of a lambda function, this `process.stdin.on` has to take in a named function and have `differences` assigned to it.
		// This is done so that it can be tested properly, as it is otherwise impossible to pass this array inside tests.
		processInput.differences = totalResult.differences;
		process.stdin.on( 'keypress', processInput );
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
				execSync( 'git commit -m "Internal: Updated CKEditor 5 packages to the latest version. [skip ci]"', execOptions );
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
 * Updates `@ckeditor/ckeditor5-*` and `ckeditor5` dependencies (with the exception of `-dev`, `-inspector`, `-react`, `-vue` and
 * `-angular`) in the specified directory to the latest version. Latest version is taken from the `version` property from the root of the
 * `package.json` file, since that value should already have been bumped at this point of release process.
 *
 * @param {String} version Target version, to which all of the eligible dependencies will be updated to.
 * @param {String} pathToUpdate Directory containing files to update.
 * @param {Boolean} dryRun If set to true, diff of changes that would be made is calculated, and included in the returned object. Without
 * this flag, file is updated normally.
 * @returns {UpdateResult}
 */
function updateDirectory( version, pathToUpdate, dryRun ) {
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

		updateObjectProperty( parsedData, 'dependencies', version );
		updateObjectProperty( parsedData, 'devDependencies', version );

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
 * Updates the CKEditor 5 dependencies, (with the exception of `-dev`, `-inspector`, `-react`, `-vue` and `-angular`), in the provided
 * `package.json` file.
 *
 * @param {Object} parsedPkgJson Object to update.
 * @param {String} propertyName Name of the property to update.
 * @param {String} version Target version, to which all of the eligible dependencies will be updated to.
 */
function updateObjectProperty( parsedPkgJson, propertyName, version ) {
	const CKEditor5Pattern = /^@ckeditor\/ckeditor5-(.*)|^ckeditor5$/;
	const patternsToSkip = [
		/^@ckeditor\/ckeditor5-dev$/,
		/^@ckeditor\/ckeditor5-dev-.*/,
		'@ckeditor/ckeditor5-angular',
		'@ckeditor/ckeditor5-react',
		'@ckeditor/ckeditor5-vue',
		'@ckeditor/ckeditor5-inspector'
	];

	for ( const dependency in parsedPkgJson[ propertyName ] ) {
		const match = dependency.match( CKEditor5Pattern );
		const shouldSkip = patternsToSkip.some( pattern => dependency.match( pattern ) );

		if ( match && !shouldSkip ) {
			parsedPkgJson[ propertyName ][ dependency ] = `^${ version }`;
		}
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
		const previous = diff[ i - 1 ];
		const current = diff[ i ];
		const next = diff[ i + 1 ];
		const currentLines = current.value.split( '\n' );

		if ( shouldFormatDifference( current, next, regex ) ) {
			// Adding removals followed by additions (formatted).
			formattedDiff.push( [
				current.value.split( regex )[ 0 ],
				' ',
				chalk.red( current.value.split( regex )[ 1 ] ),
				chalk.green( next.value.split( regex )[ 1 ] )
			].join( '' ) );

			i++;
		} else if ( current.added ) {
			// Other additions (trimming whitespaces in replacements)
			formattedDiff.push( chalk.green( previous && previous.removed ? current.value.trim() : current.value ) );
		} else if ( current.removed ) {
			// Other removals
			formattedDiff.push( chalk.red( current.value ) );
		} else if ( currentLines.length > 8 ) {
			// Cutting out the middle of a long streak of unchanged lines.
			const shortenedLines = [
				...currentLines.slice( 0, 3 ),
				chalk.gray( `[...${ currentLines.length - 7 } lines without changes...]` ),
				...currentLines.slice( -4 )
			].join( '\n' );

			formattedDiff.push( shortenedLines );
		} else {
			// Unchanged lines
			formattedDiff.push( current.value );
		}
	}

	// This turns the array from random chunks containing newlines, to uniform set of single lines.
	return formattedDiff.join( '' ).split( '\n' );
}

/**
 * Displays and removes first file changelog from a given array of file changelogs.
 *
 * @param {Array<Object>} differences Array of objects, where each element has `content` value that is an array of strings, and `file`
 * value that is a string with file name.
 */
function printNextFile( differences ) {
	const nextDiff = differences.shift();
	const formattedDiff = formatDiff( nextDiff.content );

	console.log( `File: '${ chalk.underline( nextDiff.file ) }'` );

	for ( const line of formattedDiff ) {
		console.log( line );
	}
}

/**
 * The difference between passed `currentDiff` and `nextDiff` objects should be formatted only if the `currentDiff` removed a line, then
 * `nextDiff` added a new one, and both updated a CKEditor 5 package.
 *
 * @param {Object} currentDiff
 * @param {Object} nextDiff
 * @param {String} regex
 * @returns {Boolean}
 */
function shouldFormatDifference( currentDiff, nextDiff, regex ) {
	if ( !currentDiff.removed ) {
		return false;
	}

	if ( !nextDiff.added ) {
		return false;
	}

	if ( !regex.test( currentDiff.value ) ) {
		return false;
	}

	if ( !regex.test( nextDiff.value ) ) {
		return false;
	}

	return true;
}

/**
 * Takes data about the pressed key, and produces appropriate result:
 *
 * - "Enter" / "Space": Prints next file diff, and ends the process if it was the last file or displays controls if not.
 * -               "A": Prints all the remaining file diffs, and ends the process.
 * -       "Q" / "Esc": Ends the process.
 *
 * This function is passed as a callback in `process.stdin.on( 'keypress', processInput )`. In order for this function to be tested
 * properly, it needs to be a named function that can have attached values, as otherwise passing the `differences` array would be impossible
 * in the tests.
 *
 * @param {String} chunk Streak of keyboard inputs.
 * @param {Object} key Contains information about what button was pressed, and whether or not modifiers
 * such as `ctrl` were held at the same time.
 */
function processInput( chunk, key ) {
	// Differences array should be attached to the function itself.
	const differences = processInput.differences;

	// console.log( differences[ 0 ] );

	const inputs = {
		next: [ 'space', 'return' /* 'return' means enter */ ],
		all: [ 'a' ],
		exit: [ 'q', 'escape' ]
	};

	if ( inputs.next.includes( key.name ) ) {
		console.log( chalk.yellow( 'Displaying next file.' ) );

		printNextFile( differences );

		if ( !differences.length ) {
			console.log( chalk.yellow( 'No more files.' ) );

			process.exit();
		} else {
			console.log( [
				chalk.yellow( `${ chalk.bold( 'Enter' ) } / ${ chalk.bold( 'Space' ) } - Next` ),
				chalk.yellow( `${ chalk.bold( 'A' ) } - All` ),
				chalk.yellow( `${ chalk.bold( 'Esc' ) } / ${ chalk.bold( 'Q' ) } - Exit` )
			].join( '     ' ) );
		}
	}

	if ( inputs.all.includes( key.name ) ) {
		console.log( chalk.yellow( 'Displaying all files.' ) );

		while ( differences.length ) {
			printNextFile( differences );
		}

		process.exit();
	}

	if ( inputs.exit.includes( key.name ) ) {
		console.log( chalk.yellow( 'Manual exit.' ) );

		process.exit();
	}
}

/**
 * Contains information about the way in which the files were processed.
 *
 * @typedef {Object} UpdateResult
 * @property {Number} found Number of files found.
 * @property {Number} updated Number of files updated.
 * @property {Array<Object>} differences Array of objects, where each object has string `file` containing path to the file, as well as
 * array of objects `content` returned by the `diff` library, that describes changes made to each file.
 */
