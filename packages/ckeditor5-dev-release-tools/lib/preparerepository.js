/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const upath = require( 'upath' );
const fs = require( 'fs-extra' );

const pkgJsonTemplatePath = upath.join( __dirname, 'templates', 'release-package.json' );

/**
 * @param {Object} options
 * @param {String} [options.cwd] Root of the repository to prepare. `process.cwd()` by default.
 * @param {String} options.packagesDir Path to directory containing packages.
 * @param {String} options.outputDir Path to the output directory of this script.
 * @param {Array<String>} options.rootFilesToCopy Array containing list of files or directories to copy.
 * @param {Object} options.pkgJsonContent Object containing values to use in the created package json file.
 */
module.exports = async function prepareRepository( options = {} ) {
	const cwd = upath.toUnix( options.cwd || process.cwd() );

	const outputDir = upath.join( cwd, options.outputDir );
	const packagesDir = upath.join( cwd, options.packagesDir );
	const packagesOutputDir = upath.join( outputDir, options.packagesDir );

	await fs.ensureDir( packagesOutputDir );

	// Creating root package.json file.
	const pkgJsonOutputPath = upath.join( outputDir, 'package.json' );
	const pkgJsonTemplate = await fs.readJson( pkgJsonTemplatePath );
	const pkgJsonContent = { ...pkgJsonTemplate, ...options.pkgJsonContent };
	await fs.writeJSON( pkgJsonOutputPath, pkgJsonContent );

	// Copying root package files.
	const copyRootItemsPromises = options.rootFilesToCopy.map( item => {
		const itemPath = upath.join( cwd, item );
		const itemOutputPath = upath.join( outputDir, item );

		return fs.copy( itemPath, itemOutputPath );
	} );

	// Copying packages.
	const packageNames = await fs.readdir( packagesDir );

	const copyPackagesPromises = packageNames.map( packageName => {
		const packageDir = upath.join( packagesDir, packageName );
		const packageOutputDir = upath.join( packagesOutputDir, packageName );

		return fs.copy( packageDir, packageOutputDir );
	} );

	// Waiting for all copy processes to end.
	await Promise.all( [
		...copyRootItemsPromises,
		...copyPackagesPromises
	] );
};
