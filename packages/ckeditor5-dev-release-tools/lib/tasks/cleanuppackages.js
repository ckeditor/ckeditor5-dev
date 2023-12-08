/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const upath = require( 'upath' );
const { glob } = require( 'glob' );

/**
 * The purpose of the script is to clean all packages prepared for the release. The cleaning consists of two stages:
 *
 * - Removes unnecessary files and empty directories from the package directory. Unnecessary files are those not matched by any entry from
 *   the `files` field in `package.json`. Some files are never removed, even if they are not matched by the `files` patterns:
 *   - `package.json`,
 *   - `LICENSE.md`
 *   - `README.md`
 *   - file pointed by the `main` field from `package.json`
 *   - file pointed by the `types` field from `package.json`
 * - Removes unnecessary fields from the `package.json` file.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory Relative path to a location of packages to be cleaned up.
 * @param {Array.<String>|PackageJsonFieldsToRemoveCallback} [options.packageJsonFieldsToRemove] Fields to remove from `package.json`.
 * If not set, a predefined list is used. If the callback is used, the first argument is the list with defaults.
 * @param {Boolean} [options.preservePostInstallHook] Whether to preserve the postinstall hook in `package.json`.
 * @param {String} [options.cwd] Current working directory from which all paths will be resolved.
 * @returns {Promise}
 */
module.exports = async function cleanUpPackages( options ) {
	const { packagesDirectory, packageJsonFieldsToRemove, preservePostInstallHook, cwd } = parseOptions( options );

	const packageJsonPaths = await glob( '*/package.json', {
		cwd: upath.join( cwd, packagesDirectory ),
		nodir: true,
		absolute: true
	} );

	for ( const packageJsonPath of packageJsonPaths ) {
		const packagePath = upath.dirname( packageJsonPath );
		const packageJson = await fs.readJson( packageJsonPath );

		await cleanUpPackageDirectory( packageJson, packagePath );
		cleanUpPackageJson( packageJson, packageJsonFieldsToRemove, preservePostInstallHook );

		await fs.writeJson( packageJsonPath, packageJson, { spaces: 2 } );
	}
};

/**
 * Prepares the configuration options for the script.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory
 * @param {Array.<String>|PackageJsonFieldsToRemoveCallback} [options.packageJsonFieldsToRemove=DefaultFieldsToRemove]
 * @param {Boolean} [options.preservePostInstallHook]
 * @param {String} [options.cwd=process.cwd()]
 * @returns {Object}
 */
function parseOptions( options ) {
	const defaultPackageJsonFieldsToRemove = [ 'devDependencies', 'depcheckIgnore', 'scripts', 'private' ];
	const packageJsonFieldsToRemove = typeof options.packageJsonFieldsToRemove === 'function' ?
		options.packageJsonFieldsToRemove( defaultPackageJsonFieldsToRemove ) :
		options.packageJsonFieldsToRemove || defaultPackageJsonFieldsToRemove;
	const {
		packagesDirectory,
		preservePostInstallHook = false,
		cwd = process.cwd()
	} = options;

	return {
		packagesDirectory: upath.normalizeTrim( packagesDirectory ),
		packageJsonFieldsToRemove,
		preservePostInstallHook,
		cwd: upath.normalizeTrim( cwd )
	};
}

/**
 * Removes unnecessary files and directories from the package directory.
 *
 * @param {Object} packageJson
 * @param {String} packagePath
 * @returns {Promise}
 */
async function cleanUpPackageDirectory( packageJson, packagePath ) {
	if ( packageJson.files ) {
		// Find and remove files that don't match the `files` field in the `package.json`.
		const files = await glob( '**', {
			cwd: packagePath,
			absolute: true,
			nodir: true,
			dot: true,
			ignore: [
				'README.md',
				'LICENSE.md',
				'package.json',
				...getIgnoredFilePatterns( packageJson )
			]
		} );

		for ( const file of files ) {
			await fs.remove( file );
		}
	}

	// Find and remove empty directories in the package directory.
	const globResults = await glob( '**/', {
		cwd: packagePath,
		absolute: true,
		dot: true
	} );
	const directories = globResults
		.map( path => upath.normalize( path ) )
		.sort( sortPathsFromDeepestFirst );

	for ( const directory of directories ) {
		const isEmpty = ( await fs.readdir( directory ) ).length === 0;

		if ( isEmpty ) {
			await fs.remove( directory );
		}
	}

	// Remove `node_modules`.
	await fs.remove( upath.join( packagePath, 'node_modules' ) );
}

/**
 * Creates an array of patterns to ignore for the `glob` calls.
 *
 * @param {Object} packageJson
 * @returns {Array.<String>}
 */
function getIgnoredFilePatterns( packageJson ) {
	// The patterns supported by `package.json` in the `files` field do not correspond 1:1 to the patterns expected by the `glob`.
	// For this reason, we always treat each pattern from `files` as if it was the beginning of a path to match - not just a final path.
	//
	// Example: for the entry `src` we prepare the `src/**` pattern for `glob`.
	//
	// If the globstar pattern (`**`) is alone in a path portion, then it matches zero or more directories and subdirectories.
	const patterns = packageJson.files.map( pattern => pattern + '/**' );

	if ( packageJson.main ) {
		patterns.push( packageJson.main );
	}

	if ( packageJson.types ) {
		patterns.push( packageJson.types );
	}

	return patterns;
}

/**
 * Removes unnecessary fields from the `package.json`.
 *
 * @param {Object} packageJson
 * @param {Array.<String>} packageJsonFieldsToRemove
 * @param {Boolean} preservePostInstallHook
 */
function cleanUpPackageJson( packageJson, packageJsonFieldsToRemove, preservePostInstallHook ) {
	for ( const key of Object.keys( packageJson ) ) {
		if ( !packageJsonFieldsToRemove.includes( key ) ) {
			continue;
		}

		if ( key === 'scripts' && preservePostInstallHook && packageJson.scripts.postinstall ) {
			packageJson.scripts = { 'postinstall': packageJson.scripts.postinstall };
		} else {
			delete packageJson[ key ];
		}
	}
}

/**
 * Sort function that defines the order of the paths. It sorts paths from the most nested ones first.
 *
 * @param {String} firstPath
 * @param {String} secondPath
 * @returns {Number}
 */
function sortPathsFromDeepestFirst( firstPath, secondPath ) {
	const firstPathSegments = firstPath.split( '/' ).length;
	const secondPathSegments = secondPath.split( '/' ).length;

	return secondPathSegments - firstPathSegments;
}

/**
 * @typedef {['devDependencies','depcheckIgnore','scripts','private']} DefaultFieldsToRemove
 */

/**
 * @callback PackageJsonFieldsToRemoveCallback
 * @param {DefaultFieldsToRemove} defaults
 * @returns {Array.<String>}
 */
