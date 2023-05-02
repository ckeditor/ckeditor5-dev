/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const readline = require( 'readline' );
const { execSync } = require( 'child_process' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );
const { diffLines: diff } = require( 'diff' );

// The pattern defines CKEditor 5 dependencies.
const CKEDITOR5_DEPENDENCY_PATTERN = /^@ckeditor\/ckeditor5-(.*)|^ckeditor5(-collaboration)?$/;

// Packages that match the CKEditor 5 pattern but should not be updated because they aren't a dependency of the project.
const PATTERNS_TO_SKIP = [
	/^@ckeditor\/ckeditor5-dev$/,
	/^@ckeditor\/ckeditor5-dev-.*/,
	'@ckeditor/ckeditor5-angular',
	'@ckeditor/ckeditor5-react',
	'@ckeditor/ckeditor5-vue',
	'@ckeditor/ckeditor5-inspector'
];

/**
 * The purpose of this script is to update a version of `ckeditor5` and `@ckeditor/ckeditor5-*` dependencies to
 * a version specified in `options.version`.
 *
 * The script can commit changes for all packages in specified directories. See the `CKEditor5EntryItem` interface.
 *
 * If you want to see what kind of changes the script does, set the `dryRun` flag to `true`. Instead of committing anything, the script
 * will display changes on the screen.
 *
 * The following packages will not be touched:
 * * Integrations (@ckeditor/ckeditor5-@(vue|angular|react)
 * * Dev-tools (@ckeditor/ckeditor5-dev-*)
 * * Inspector (@ckeditor/ckeditor5-inspector)
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.version Target version, all of the eligible dependencies will be updated to.
 * @param {Array.<CKEditor5EntryItem>} options.packages An array containing paths where to look for packages to update.
 * @param {Boolean} [options.dryRun=false] If set on true, all changes will be printed on the screen instead of committed.
 */
module.exports = function updateCKEditor5Dependencies( options ) {
	const totalResult = { found: 0, updated: 0, toCommit: 0, differences: [] };
	const pathsToCommit = [];

	console.log( '\n📍 ' + chalk.blue( 'Updating CKEditor 5 dependencies...\n' ) );

	if ( options.dryRun ) {
		console.log( `⚠️  ${ chalk.yellow( 'DRY RUN mode' ) } ⚠️` );
		console.log( chalk.yellow( 'The script WILL NOT modify anything but instead show differences that would be made.\n' ) );
	}

	for ( const entryItem of options.packages ) {
		console.log( `Looking for packages in the '${ chalk.underline( entryItem.directory ) }/' directory...` );

		// An absolute path to a directory where to look for packages.
		const absolutePath = path.join( options.cwd, entryItem.directory );
		const results = updatePackagesInDirectory( options.version, absolutePath, options.dryRun );

		totalResult.found += results.found;
		totalResult.updated += results.updated;
		totalResult.differences.push( ...results.differences );

		if ( !results.found ) {
			console.log( 'No files were found.\n' );
		} else if ( !results.updated ) {
			console.log( `${ chalk.bold( results.found ) } files were found, but none needed to be updated.\n` );
		} else {
			console.log( `Out of ${ chalk.bold( results.found ) } files found, ${ chalk.bold( results.updated ) } were updated.\n` );

			if ( entryItem.commit ) {
				totalResult.toCommit += results.updated;
				pathsToCommit.push( absolutePath );
			}
		}
	}

	if ( options.dryRun ) {
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

			// First, add changes from specified paths to stage...
			for ( const absoluteDirectoryPath of pathsToCommit ) {
				console.log( `${ chalk.green( '+' ) } '${ chalk.underline( absoluteDirectoryPath ) }'` );

				execSync( 'git add "*/package.json"', {
					stdio: 'inherit',
					cwd: absoluteDirectoryPath
				} );
			}

			// ...then, commit all changes in a single commit.
			execSync( 'git commit -m "Internal: Updated CKEditor 5 packages to the latest version. [skip ci]"', {
				stdio: 'inherit',
				cwd: options.cwd
			} );

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
 * Updates `@ckeditor/ckeditor5-*` and `ckeditor5` dependencies. The following packages will be ignored:
 * * Integrations (@ckeditor/ckeditor5-@(vue|angular|react)
 * * Dev-tools (@ckeditor/ckeditor5-dev-*)
 * * Inspector (@ckeditor/ckeditor5-inspector)
 *
 * @param {String} version Target version, all of the eligible dependencies will be updated to.
 * @param {String} packagesDirectory Directory containing packages to update.
 * @param {Boolean} dryRun If set to true, diff of changes that would be made is calculated, and included in the returned object.
 * @returns {UpdateResult}
 */
function updatePackagesInDirectory( version, packagesDirectory, dryRun ) {
	const packageJsonArray = glob.sync( '*/package.json', {
		cwd: packagesDirectory,
		absolute: true
	} );

	let updatedFiles = 0;
	const differences = [];

	for ( const packageJsonPath of packageJsonArray ) {
		const currentContent = fs.readFileSync( packageJsonPath, 'utf-8' );
		const contentAsJson = JSON.parse( currentContent );

		updateObjectProperty( contentAsJson, 'dependencies', version );
		updateObjectProperty( contentAsJson, 'devDependencies', version );

		const newContent = JSON.stringify( contentAsJson, null, 2 ) + '\n';

		// No changes.
		if ( currentContent === newContent ) {
			continue;
		}

		if ( dryRun ) {
			differences.push( {
				file: packageJsonPath,
				content: diff( currentContent, newContent, { newlineIsToken: true } )
			} );
		} else {
			fs.writeFileSync( packageJsonPath, newContent, 'utf-8' );
		}

		updatedFiles++;
	}

	return {
		found: packageJsonArray.length,
		updated: updatedFiles,
		differences
	};
}

/**
 * Updates the CKEditor 5 dependencies.
 *
 * @param {Object} packageJson `package.json` as JSON object to update.
 * @param {'dependencies'|'devDependencies'} propertyName Name of the property to update.
 * @param {String} version Target version, all of the eligible dependencies will be updated to.
 */
function updateObjectProperty( packageJson, propertyName, version ) {
	// "dependencies" or "devDependencies" are not specified. There is nothing to update.
	if ( !packageJson[ propertyName ] ) {
		return;
	}

	for ( const packageName of Object.keys( packageJson[ propertyName ] ) ) {
		const match = packageName.match( CKEDITOR5_DEPENDENCY_PATTERN );
		const shouldSkip = PATTERNS_TO_SKIP.some( pattern => packageName.match( pattern ) );

		if ( match && !shouldSkip ) {
			packageJson[ propertyName ][ packageName ] = `^${ version }`;
		}
	}
}

/**
 * Takes in raw changelog for a single file generated by `diff` library, and returns formatted array of strings, containing
 * human-readable, line by line changelog of a file, with removals and additions colored. If the file has any longer parts without changes,
 * these will be partially hidden.
 *
 * @param {Array.<Object>} diff Array of changes for a single file generated by `diff` library.
 * @returns {Array.<String>} Formatted changelog split into single lines.
 */
function formatDiff( diff ) {
	const formattedDiff = [];

	// Searches for a space in the following expression: `"dependency": "version"`.
	// It is used for displaying pretty diff.
	const keyValueSpaceRegexp = /(?<=":) (?=")/;

	for ( let i = 0; i < diff.length; i++ ) {
		const previous = diff[ i - 1 ];
		const current = diff[ i ];
		const next = diff[ i + 1 ];
		const currentLines = current.value.split( '\n' );

		if ( shouldFormatDifference( current, next, keyValueSpaceRegexp ) ) {
			// Adding removals followed by additions (formatted).
			formattedDiff.push( [
				current.value.split( keyValueSpaceRegexp )[ 0 ],
				' ',
				chalk.red( current.value.split( keyValueSpaceRegexp )[ 1 ] ),
				chalk.green( next.value.split( keyValueSpaceRegexp )[ 1 ] )
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
 * @param {Array.<Object>} differences Array of objects, where each element has `content` value that is an array of strings, and `file`
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
	if ( !nextDiff ) {
		return false;
	}

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
 * @property {Array.<Object>} differences Array of objects, where each object has string `file` containing path to the file, as well as
 * array of objects `content` returned by the `diff` library, that describes changes made to each file.
 */

/**
 * A definition of a directory where to look for packages.
 *
 * @typedef {Object} CKEditor5EntryItem
 *
 * @property {String} directory A relative path (to root directory) where to look for packages.
 * @property {Boolean} [commit=false] Whether changes should be committed.
 */
