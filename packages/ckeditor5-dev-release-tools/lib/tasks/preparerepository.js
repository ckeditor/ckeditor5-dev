/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import { glob } from 'glob';
import upath from 'upath';

/**
 * The goal is to prepare the release directory containing the packages we want to publish.
 *
 * @param {object} options
 * @param {string} options.outputDirectory Relative path to the destination directory where packages will be stored.
 * @param {string} [options.cwd] Root of the repository to prepare. `process.cwd()` by default.
 * @param {string} [options.packagesDirectory] Relative path to a location of packages.
 * If specified, all of the found packages will be copied.
 * @param {Array.<string>} [options.packagesToCopy] List of packages that should be processed.
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
	await fs.mkdir( outputDirectoryPath, { recursive: true } );
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
 * @param {object} packageJson
 * @param {string} [packageJson.name]
 * @param {Array.<string>} [packageJson.files]
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
 * @param {object} options
 * @param {string} options.cwd
 * @param {RootPackageJson} options.rootPackageJson
 * @param {string} options.outputDirectoryPath
 * @returns {Promise}
 */
async function processRootPackage( { cwd, rootPackageJson, outputDirectoryPath } ) {
	const rootPackageDirName = rootPackageJson.name.replace( /^@.*\//, '' );
	const rootPackageOutputPath = upath.join( outputDirectoryPath, rootPackageDirName );
	const pkgJsonOutputPath = upath.join( rootPackageOutputPath, 'package.json' );

	await fs.mkdir( rootPackageOutputPath, { recursive: true } );
	await fs.writeFile( pkgJsonOutputPath, JSON.stringify( rootPackageJson, null, 2 ) + '\n' );

	return ( await glob( rootPackageJson.files ) )
		.map( absoluteFilePath => {
			const relativeFilePath = upath.relative( cwd, absoluteFilePath );
			const absoluteFileOutputPath = upath.join( rootPackageOutputPath, relativeFilePath );

			return fs.cp( absoluteFilePath, absoluteFileOutputPath, { recursive: true } );
		} );
}

/**
 * @param {object} options
 * @param {string} options.cwd
 * @param {string} options.packagesDirectory
 * @param {string} options.outputDirectoryPath
 * @param {Array.<string>} [options.packagesToCopy]
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
		const hasPkgJson = await fs.access( pkgJsonPath ).then( () => true, () => false );

		if ( !hasPkgJson ) {
			return;
		}

		return fs.cp( packagePath, upath.join( outputDirectoryPath, packageDir ), { recursive: true } );
	} );
}

/**
 * @typedef {object} RootPackageJson
 *
 * @param {string} options.rootPackageJson.name Name of the package. Required value.
 *
 * @param {Array.<string>} options.rootPackageJson.files Array containing a list of files or directories to copy. Required value.
 */
