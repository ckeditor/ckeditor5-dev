/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const upath = require( 'upath' );

/**
 * @param {Object} options
 * @param {String} options.outputDirectory Relative path to the destination directory where packages will be stored.
 * @param {String} [options.cwd] Root of the repository to prepare. `process.cwd()` by default.
 * @param {String} [options.packagesDirectory] Relative path to a location of packages.
 * If specified, all of the found packages will be copied.
 * @param {Array.<String>} [options.packagesToCopy] List of packages that should be processed.
 * If not specified, all packages found in `packagesDirectory` are considered.
 * @param {Object} [options.rootPackage] Definition of a root package (found in the `cwd` directory).
 * If not specified, the root package will not be created.
 * @param {Object} options.rootPackage.packageJson Object containing values to use in the created the `package.json` file.
 * @param {Array.<String>} options.rootPackage.files Array containing a list of files or directories to copy.
 */
module.exports = async function prepareRepository( options ) {
	const {
		outputDirectory,
		cwd = process.cwd(),
		packagesDirectory,
		packagesToCopy,
		rootPackage
	} = options;

	if ( !rootPackage && !packagesDirectory ) {
		return;
	}

	const outputDirectoryPath = upath.join( cwd, outputDirectory );
	await fs.emptyDir( outputDirectoryPath );

	const copyPromises = [];

	if ( rootPackage ) {
		const copyRootItemsPromises = await processRootPackage( {
			cwd,
			rootPackage,
			outputDirectoryPath
		} );

		copyPromises.push( ...copyRootItemsPromises );
	}

	if ( packagesDirectory ) {
		const copyPackagesPromises = await processMonorepoPackages( {
			cwd,
			packagesDirectory,
			packagesToCopy,
			outputDirectoryPath
		} );

		copyPromises.push( ...copyPackagesPromises );
	}

	return Promise.all( copyPromises );
};

async function processRootPackage( { cwd, rootPackage, outputDirectoryPath } ) {
	const pkgJsonOutputPath = upath.join( outputDirectoryPath, 'package.json' );
	await fs.writeJson( pkgJsonOutputPath, rootPackage.packageJson, { spaces: 2, EOL: '\n' } );

	return rootPackage.files.map( item => {
		const itemPath = upath.join( cwd, item );
		const itemOutputPath = upath.join( outputDirectoryPath, item );

		return fs.copy( itemPath, itemOutputPath );
	} );
}

async function processMonorepoPackages( { cwd, packagesDirectory, packagesToCopy, outputDirectoryPath } ) {
	const packagesDirectoryPath = upath.join( cwd, packagesDirectory );
	const packagesOutputDirectoryPath = upath.join( outputDirectoryPath, packagesDirectory );
	const packageDirs = packagesToCopy || await fs.readdir( packagesDirectoryPath );

	await fs.ensureDir( packagesOutputDirectoryPath );

	return packageDirs.map( async packageDir => {
		const packagePath = upath.join( packagesDirectoryPath, packageDir );
		const isDir = ( await fs.lstat( packagePath ) ).isDirectory();

		if ( !isDir ) {
			return;
		}

		const pkgJsonPath = upath.join( packagePath, 'package.json' );
		const hasPkgJson = await fs.existsSync( pkgJsonPath );

		if ( !hasPkgJson ) {
			return;
		}

		return fs.copy( packagePath, upath.join( packagesOutputDirectoryPath, packageDir ) );
	} );
}
