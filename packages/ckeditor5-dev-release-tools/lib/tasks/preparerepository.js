/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const upath = require( 'upath' );
const fs = require( 'fs-extra' );

const pkgJsonTemplatePath = upath.join( __dirname, '..', 'templates', 'release-package.json' );

/**
 * @param {Object} options
 * @param {String} [options.cwd] Root of the repository to prepare. `process.cwd()` by default.
 * @param {String} [options.packagesDir] Path to directory containing packages. `packages` by default.
 * @param {String} [options.outputDir] Path to the output directory of this script. `release` by default.
 * @param {Object} options.pkgJsonContent Object containing values to use in the created package json file.
 * @param {Array<String>} options.rootFilesToCopy Array containing list of files or directories to copy.
 * @param {Array<String>} [options.packagesToCopy] Optional argument specifying packages to copy from the `packagesDir`.
 * This can contain nested package paths. If left empty, all non-nested packages from the `packagesDir` will be processed.
 */
module.exports = async function prepareRepository( options ) {
	const {
		cwd = process.cwd(),
		packagesDir = 'packages',
		outputDir = 'release',
		pkgJsonContent,
		rootFilesToCopy,
		packagesToCopy
	} = options;

	const outputDirPath = upath.join( cwd, outputDir );
	const packagesDirPath = upath.join( cwd, packagesDir );
	const packagesOutputDir = upath.join( outputDirPath, packagesDir );

	await fs.ensureDir( packagesOutputDir );

	// Creating root package.json file.
	const pkgJsonOutputPath = upath.join( outputDirPath, 'package.json' );
	const pkgJsonTemplate = await fs.readJson( pkgJsonTemplatePath );
	const pkgJsonNewContent = { ...pkgJsonTemplate, ...pkgJsonContent };
	await fs.writeJson( pkgJsonOutputPath, pkgJsonNewContent, { spaces: 2, EOL: '\n' } );

	// Copying root package files.
	const copyRootItemsPromises = rootFilesToCopy.map( item => {
		const itemPath = upath.join( cwd, item );
		const itemOutputPath = upath.join( outputDirPath, item );

		return fs.copy( itemPath, itemOutputPath );
	} );

	// Copying packages.
	const packageDirs = packagesToCopy || await fs.readdir( packagesDirPath );

	const copyPackagesPromises = packageDirs.map( packageDir => {
		return fs.copy(
			upath.join( packagesDirPath, packageDir ),
			upath.join( packagesOutputDir, packageDir )
		);
	} );

	// Waiting for all copy processes to end.
	await Promise.all( [
		...copyRootItemsPromises,
		...copyPackagesPromises
	] );
};
