/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const upath = require( 'upath' );
const { globSync } = require( 'glob' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const chalk = require( 'chalk' );
const fs = require( 'fs-extra' );

/**
 * Npm sometimes throws incorrect error 409 while publishing, while the package uploads correctly.
 * The purpose of the script is to validate if packages that threw 409 are uploaded correctly to npm.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory Relative path to a location of packages to release.
 * @param {String} options.version Version of the current release.
 * @returns {Promise}
 */
module.exports = async function verifyPackagesPublishedCorrectly( options ) {
	const { packagesDirectory, version } = options;
	const packagesToVerify = globSync( upath.join( packagesDirectory, '*' ), { absolute: true } );
	const errors = [];

	if ( !packagesToVerify.length ) {
		console.log( chalk.bold.green( 'No packages found to check for upload error 409.' ) );

		return;
	}

	for ( const packageToVerify of packagesToVerify ) {
		const packageJson = await fs.readJson( upath.join( packageToVerify, 'package.json' ) );

		try {
			await tools.shExec( `npm show ${ packageJson.name }@${ version }`, {
				async: true,
				verbosity: 'silent'
			} );

			await fs.remove( packageToVerify );
		} catch {
			errors.push( packageJson.name );
		}
	}

	if ( errors.length ) {
		console.error( chalk.bold.red( 'Packages that were uploaded incorrectly, and need manual verification:\n' + errors.join( '\n' ) ) );
		process.exit( 1 );
	}

	console.log( chalk.bold.green( 'All packages that returned 409 were uploaded correctly.' ) );
};
