/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const path = require( 'path' );
const fs = require( 'fs-extra' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const { getLastFromChangelog } = require( '../utils/versions' );
const executeOnPackages = require( '../utils/executeonpackages' );

/**
 * Fields that will not be removed from `package.json` while preparing a package.
 */
const PACKAGE_JSON_FIELDS = [
	'author',
	'dependencies',
	'description',
	'engine',
	'homepage',
	'license',
	'keywords',
	'name',
	'version',
	'files',
	'main',
	'types',
	'scripts'
];

/**
 * Prepares packages to be released:
 *
 *  * removes TypeScript sources (but keeps typings),
 *  * secures the code of packages,
 *  * replaces the main package entry point (use JS file instead of TS),
 *  * prepares builds for all packages if a command is specified as npm script.
 *
 * The dry-run mode is not supported as the script creates a directory that should not be tracked by Git.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for sources of packages (dependencies).
 * @param {String} options.releaseDirectory Where to copy the packages (dependencies).
 * @param {String} options.changelogDirectory An absolute path to the directory where the `CHANGELOG.md` file is saved.
 * @param {String} options.buildScript A name of npm script that builds the package. It is executed per package.
 * @param {String} options.secureScript A name of npm script that secures the code in the entire repository.
 * @param {Array.<String>} [options.npmScriptsToRemove=[]] An array of npm scripts that should be removed when processing a package.
 * @returns {Promise}
 */
module.exports = async function preparePackages( options ) {
	const cwd = process.cwd();
	const packagesDirectory = path.join( options.cwd, options.packages );
	const releaseDirectory = path.join( options.cwd, options.releaseDirectory );
	const ckeditor5Version = getLastFromChangelog( options.changelogDirectory );
	const npmScriptsToRemove = options.npmScriptsToRemove || [];

	// Clean the release directory before doing anything.
	logProcess( 'Removing the release directory...' );
	await fs.remove( releaseDirectory );

	// Copy packages to the temporary, release directory.
	logProcess( 'Copying packages to release...' );
	await fs.copy( packagesDirectory, releaseDirectory );

	// Find all short package names in the release directory.
	// Then, map the names to absolute paths and their `package.json`.
	const directoryNames = ( await fs.readdir( releaseDirectory, { withFileTypes: true } ) )
		.filter( dirent => dirent.isDirectory() )
		.map( dirent => dirent.name )
		.map( name => {
			const packagePath = path.join( releaseDirectory, name );
			const packageJson = require( path.join( packagePath, 'package.json' ) );

			return [ packagePath, packageJson ];
		} );

	const packages = new Map( directoryNames );

	// Filter out packages without changes. They won't be released.
	logProcess( 'Verifying packages...' );
	await filterOutPackagesWithoutChanges( packages, ckeditor5Version );

	if ( !packages.size ) {
		logProcess( 'Nothing to release. Aborting.' );
		return;
	}

	logProcess( 'Preparing packages...' );
	await preparePackagesToBeReleased( packages, npmScriptsToRemove );

	// Secure the entire release directory.
	logProcess( 'Securing the code...' );
	exec( options.secureScript );

	logProcess( 'Preparing builds...' );
	await prepareBuilds( packages, options.buildScript );

	process.chdir( cwd );

	logProcess( 'Done.' );
	logInfo( chalk.grey( `Review the "${ options.releaseDirectory }/" directory before publishing the packages on npm.\n` ) );
};

/**
 * Check if packages should be released. It compares the packages' version against the latest version in CKEditor 5 changelog.
 *
 * If they are different, it means that a package should not be released and it is removed from the release directory.
 *
 * @param {Map.<String, PackageJson>} packages
 * @param {String} ckeditor5Version
 * @returns {Promise}
 */
function filterOutPackagesWithoutChanges( packages, ckeditor5Version ) {
	return executeOnPackages( packages.keys(), async packagePath => {
		const { name: packageName, version: packageVersion } = packages.get( packagePath );

		logInfo( `* Checking "${ chalk.underline( packageName ) }"...`, { indent: 1, startWithNewLine: true } );

		if ( packageVersion !== ckeditor5Version ) {
			logInfo( chalk.grey( 'Nothing to release. Skipping.' ), { indent: 1 } );

			await fs.remove( packagePath );
			packages.delete( packagePath );
		}
	} );
}

/**
 * Prepare packages to be released. It means, for each package we do the following actions:
 *
 *   * Remove TypeScript sources, but keep typing files (`.d.ts`).
 *   * Redefine the main script of a package. Replace the TypeScript extension with JavaScript.
 *   * Remove all tests of the package as they should not be released.
 *   * Remove the `build/` directory. The build script will re-create it from the JavaScript code.
 *
 * @param {Map.<String, PackageJson>} packages
 * @param {Array.<String>} npmScriptsToRemove An array of npm scripts that should be removed when processing a package.
 * @returns {Promise}
 */
function preparePackagesToBeReleased( packages, npmScriptsToRemove ) {
	return executeOnPackages( packages.keys(), async packagePath => {
		const { name: packageName } = packages.get( packagePath );

		logInfo( `* Processing "${ chalk.underline( packageName ) }"...`, { indent: 1, startWithNewLine: true } );
		logInfo( chalk.grey( 'Cleaning-up the package directory...' ), { indent: 2 } );

		// The build will be refreshed. To avoid weird caches or building from TypeScript, let's clean the directory.
		await fs.remove( path.join( packagePath, 'build' ) );

		// Tests will not be published anyway. To increase readability, let's clean it too.
		await fs.remove( path.join( packagePath, 'tests' ) );

		// Update the entry point in the `package.json` file to point to a JavaScript file.
		logInfo( chalk.grey( 'Replacing the package entry point (TS => JS)...' ), { indent: 2 } );

		tools.updateJSONFile( path.join( packagePath, 'package.json' ), packageJson => {
			const { main } = packageJson;

			// Remove properties from package.json that are not related to the production package.
			for ( const property of Object.keys( packageJson ) ) {
				if ( !PACKAGE_JSON_FIELDS.includes( property ) ) {
					delete packageJson[ property ];
				}
			}

			if ( 'scripts' in packageJson ) {
				for ( const npmScript of npmScriptsToRemove ) {
					delete packageJson.scripts[ npmScript ];
				}
			}

			if ( !main ) {
				return packageJson;
			}

			packageJson.main = main.replace( /.ts$/, '.js' );
			packageJson.types = main.replace( /.ts$/, '.d.ts' );

			return packageJson;
		} );

		// Find all TypeScript sources...
		const typescriptFiles = await new Promise( ( resolve, reject ) => {
			glob( '**/*.ts', { cwd: packagePath }, ( err, files ) => {
				return err ? reject( err ) : resolve( files );
			} );
		} );

		logInfo( chalk.grey( 'Removing TypeScript sources...' ), { indent: 2 } );

		// ...and remove all non-typing files.
		for ( const tsFile of typescriptFiles ) {
			if ( !tsFile.endsWith( '.d.ts' ) ) {
				await fs.remove( path.join( packagePath, tsFile ) );
			}
		}
	} );
}

/**
 * Executed a build task for all packages.
 *
 * @param {Map.<String, PackageJson>} packages
 * @param {String} buildScript
 * @returns {Promise}
 */
function prepareBuilds( packages, buildScript ) {
	return executeOnPackages( packages.keys(), async packagePath => {
		const { name: packageName, scripts = {} } = packages.get( packagePath );

		if ( buildScript in scripts ) {
			logInfo( `* Processing "${ chalk.underline( packageName ) }"...`, { indent: 1, startWithNewLine: true } );

			process.chdir( packagePath );

			exec( `yarn run ${ buildScript }` );
		}
	} );
}

/**
 * @param {String} message
 */
function logProcess( message ) {
	console.log( '\n📍 ' + chalk.cyan( message ) );
}

/**
 * @param {String} message
 * @param {Object} options
 * @param {Number} [options.indent=0]
 * @param {Boolean} [options.startWithNewLine=false]
 */
function logInfo( message, { indent = 0, startWithNewLine = false } = {} ) {
	console.log( ( startWithNewLine ? '\n' : '' ) + ' '.repeat( indent * 3 ) + message );
}

/**
 * @param {String} command
 * @returns {String}
 */
function exec( command ) {
	return tools.shExec( command );
}

/**
 * @typedef {Object} PackageJson
 * @property {String} version
 * @property {String} name
 */
