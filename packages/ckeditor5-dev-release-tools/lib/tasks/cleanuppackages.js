/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import upath from 'upath';
import { glob } from 'glob';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

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
 * @param {object} options
 * @param {string} options.packagesDirectory Relative path to a location of packages to be cleaned up.
 * @param {Array.<string>|PackageJsonFieldsToRemoveCallback} [options.packageJsonFieldsToRemove] Fields to remove from `package.json`.
 * If not set, a predefined list is used. If the callback is used, the first argument is the list with defaults.
 * @param {boolean} [options.preservePostInstallHook] Whether to preserve the postinstall hook in `package.json`.
 * @param {string} [options.cwd] Current working directory from which all paths will be resolved.
 * @returns {Promise}
 */
export default async function cleanUpPackages( options ) {
	const { packagesDirectory, packageJsonFieldsToRemove, preservePostInstallHook, cwd } = parseOptions( options );
	const packageJsonPaths = await workspaces.findPathsToPackages( cwd, packagesDirectory, { includePackageJson: true } );

	for ( const packageJsonPath of packageJsonPaths ) {
		const packagePath = upath.dirname( packageJsonPath );
		const packageJsonFile = await fs.readFile( packageJsonPath, 'utf-8' );
		const packageJson = JSON.parse( packageJsonFile );

		await cleanUpPackageDirectory( packageJson, packagePath );
		cleanUpPackageJson( packageJson, packageJsonFieldsToRemove, preservePostInstallHook );

		await fs.writeFile( packageJsonPath, JSON.stringify( packageJson, null, 2 ) );
	}
}

/**
 * Prepares the configuration options for the script.
 *
 * @param {object} options
 * @param {string} options.packagesDirectory
 * @param {Array.<string>|PackageJsonFieldsToRemoveCallback} [options.packageJsonFieldsToRemove=DefaultFieldsToRemove]
 * @param {boolean} [options.preservePostInstallHook]
 * @param {string} [options.cwd=process.cwd()]
 * @returns {object}
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
 * @param {object} packageJson
 * @param {string} packagePath
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
			await fs.rm( file );
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
			await fs.rm( directory, { recursive: true, force: true } );
		}
	}

	// Remove `node_modules`.
	await fs.rm( upath.join( packagePath, 'node_modules' ), { recursive: true, force: true } );
}

/**
 * Creates an array of patterns to ignore for the `glob` calls.
 *
 * @param {object} packageJson
 * @returns {Array.<string>}
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
 * @param {object} packageJson
 * @param {Array.<string>} packageJsonFieldsToRemove
 * @param {boolean} preservePostInstallHook
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
 * @param {string} firstPath
 * @param {string} secondPath
 * @returns {number}
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
 * @returns {Array.<string>}
 */
