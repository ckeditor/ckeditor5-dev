/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import { glob } from 'glob';
import upath from 'upath';

/**
 * The goal is to prepare the release directory containing the packages we want to publish.
 *
 * @param {Object} options
 * @param {String} options.outputDirectory Relative path to the destination directory where packages will be stored.
 * @param {String} [options.cwd] Root of the repository to prepare. `process.cwd()` by default.
 * @param {String} [options.packagesDirectory] Relative path to a location of packages.
 * If specified, all of the found packages will be copied.
 * @param {Array.<String>} [options.packagesToCopy] List of packages that should be processed.
 * If not specified, all packages found in `packagesDirectory` are considered.
 * @param {RootPackageJson} [options.rootPackageJson] Object containing values to use in the created the `package.json` file.
 * If not specified, the root package will not be created.
 * @returns {Promise}
 */
export default async function prepareRepository( options ) {
	const {
		outputDirectory,
		packagesDirectory,
		packagesToCopy,
		rootPackageJson,
		cwd = process.cwd()
	} = options;

	if ( !rootPackageJson && !packagesDirectory ) {
		return;
	}

	const outputDirectoryPath = upath.join( cwd, outputDirectory );
	await fs.ensureDir( outputDirectoryPath );
	const outputDirContent = await fs.readdir( outputDirectoryPath );

	if ( outputDirContent.length ) {
		throw new Error( `Output directory is not empty: "${ outputDirectoryPath }".` );
	}

	const copyPromises = [];

	if ( rootPackageJson ) {
		validateRootPackage( rootPackageJson );

		const copyRootItemsPromises = await processRootPackage( {
			cwd,
			rootPackageJson,
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
}

/**
 * @param {Object} packageJson
 * @param {String} [packageJson.name]
 * @param {Array.<String>} [packageJson.files]
 */
function validateRootPackage( packageJson ) {
	if ( !packageJson.name ) {
		throw new Error( '"rootPackageJson" option object must have a "name" field.' );
	}

	if ( !packageJson.files ) {
		throw new Error( '"rootPackageJson" option object must have a "files" field.' );
	}
}

/**
 * @param {Object} options
 * @param {String} options.cwd
 * @param {RootPackageJson} options.rootPackageJson
 * @param {String} options.outputDirectoryPath
 * @returns {Promise}
 */
async function processRootPackage( { cwd, rootPackageJson, outputDirectoryPath } ) {
	const rootPackageDirName = rootPackageJson.name.replace( /^@.*\//, '' );
	const rootPackageOutputPath = upath.join( outputDirectoryPath, rootPackageDirName );
	const pkgJsonOutputPath = upath.join( rootPackageOutputPath, 'package.json' );

	await fs.ensureDir( rootPackageOutputPath );
	await fs.writeJson( pkgJsonOutputPath, rootPackageJson, { spaces: 2, EOL: '\n' } );

	return ( await glob( rootPackageJson.files ) )
		.map( absoluteFilePath => {
			const relativeFilePath = upath.relative( cwd, absoluteFilePath );
			const absoluteFileOutputPath = upath.join( rootPackageOutputPath, relativeFilePath );

			return fs.copy( absoluteFilePath, absoluteFileOutputPath );
		} );
}

/**
 * @param {Object} options
 * @param {String} options.cwd
 * @param {String} options.packagesDirectory
 * @param {String} options.outputDirectoryPath
 * @param {Array.<String>} [options.packagesToCopy]
 * @returns {Promise}
 */
async function processMonorepoPackages( { cwd, packagesDirectory, packagesToCopy, outputDirectoryPath } ) {
	const packagesDirectoryPath = upath.join( cwd, packagesDirectory );
	const packageDirs = packagesToCopy || await fs.readdir( packagesDirectoryPath );

	return packageDirs.map( async packageDir => {
		const packagePath = upath.join( packagesDirectoryPath, packageDir );
		const isDir = ( await fs.lstat( packagePath ) ).isDirectory();

		if ( !isDir ) {
			return;
		}

		const pkgJsonPath = upath.join( packagePath, 'package.json' );
		const hasPkgJson = await fs.exists( pkgJsonPath );

		if ( !hasPkgJson ) {
			return;
		}

		return fs.copy( packagePath, upath.join( outputDirectoryPath, packageDir ) );
	} );
}

/**
 * @typedef {Object} RootPackageJson
 *
 * @param {String} options.rootPackageJson.name Name of the package. Required value.
 *
 * @param {Array.<String>} options.rootPackageJson.files Array containing a list of files or directories to copy. Required value.
 */
