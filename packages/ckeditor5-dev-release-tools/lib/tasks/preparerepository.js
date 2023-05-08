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
 * @param {Object} [options.rootPackageJson] Object containing values to use in the created the `package.json` file.
 * If not specified, the root package will not be created.
 * @param {String} options.rootPackageJson.name Name of the package. Required value.
 * @param {Array.<String>} options.rootPackageJson.files Array containing a list of files or directories to copy. Required value.
 */
module.exports = async function prepareRepository( options ) {
	const {
		outputDirectory,
		cwd = process.cwd(),
		packagesDirectory,
		packagesToCopy,
		rootPackageJson
	} = options;

	if ( !rootPackageJson && !packagesDirectory ) {
		return;
	}

	const outputDirPath = upath.join( cwd, outputDirectory );
	await fs.ensureDir( outputDirPath );
	const outputDirContent = await fs.readdir( outputDirPath );

	if ( outputDirContent.length ) {
		throw new Error( `Output directory is not empty: "${ outputDirPath }"` );
	}

	const copyPromises = [];

	if ( rootPackageJson ) {
		const copyRootItemsPromises = await processRootPackage( {
			cwd,
			rootPackageJson,
			outputDirPath
		} );

		copyPromises.push( ...copyRootItemsPromises );
	}

	if ( packagesDirectory ) {
		const copyPackagesPromises = await processMonorepoPackages( {
			cwd,
			packagesDirectory,
			packagesToCopy,
			outputDirPath
		} );

		copyPromises.push( ...copyPackagesPromises );
	}

	return Promise.all( copyPromises );
};

async function processRootPackage( { cwd, rootPackageJson, outputDirPath } ) {
	if ( !rootPackageJson.name ) {
		throw new Error( '"rootPackageJson" option object must have a "name" field.' );
	}

	if ( !rootPackageJson.files ) {
		throw new Error( '"rootPackageJson" option object must have a "files" field.' );
	}

	const rootPackageOutputPath = upath.join( outputDirPath, rootPackageJson.name );
	const pkgJsonOutputPath = upath.join( rootPackageOutputPath, 'package.json' );

	await fs.ensureDir( rootPackageOutputPath );
	await fs.writeJson( pkgJsonOutputPath, rootPackageJson, { spaces: 2, EOL: '\n' } );

	return rootPackageJson.files.map( item => {
		const itemPath = upath.join( cwd, item );
		const itemOutputPath = upath.join( rootPackageOutputPath, item );

		return fs.copy( itemPath, itemOutputPath );
	} );
}

async function processMonorepoPackages( { cwd, packagesDirectory, packagesToCopy, outputDirPath } ) {
	const packagesDirectoryPath = upath.join( cwd, packagesDirectory );
	const packageDirs = packagesToCopy || await fs.readdir( packagesDirectoryPath );

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

		return fs.copy( packagePath, upath.join( outputDirPath, packageDir ) );
	} );
}
