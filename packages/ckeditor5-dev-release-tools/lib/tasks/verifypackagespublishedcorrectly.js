/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const upath = require( 'upath' );
const { glob } = require( 'glob' );
const fs = require( 'fs-extra' );
const { checkVersionAvailability } = require( '../utils/checkversionavailability' );

/**
 * Npm sometimes throws incorrect error 409 while publishing, while the package uploads correctly.
 * The purpose of the script is to validate if packages that threw 409 are uploaded correctly to npm.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory Relative path to a location of packages to release.
 * @param {String} options.version Version of the current release.
 * @param {Function} options.onSuccess Callback fired when function is successful.
 * @returns {Promise}
 */
module.exports = async function verifyPackagesPublishedCorrectly( options ) {
	const { packagesDirectory, version, onSuccess } = options;
	const packagesToVerify = await glob( upath.join( packagesDirectory, '*' ), { absolute: true } );
	const errors = [];

	if ( !packagesToVerify.length ) {
		onSuccess( '✅ No packages found to check for upload error 409.' );

		return;
	}

	for ( const packageToVerify of packagesToVerify ) {
		const packageJson = await fs.readJson( upath.join( packageToVerify, 'package.json' ) );

		try {
			const packageWasUploadedCorrectly = !await checkVersionAvailability( version, packageJson.name );

			if ( packageWasUploadedCorrectly ) {
				await fs.remove( packageToVerify );
			} else {
				errors.push( packageJson.name );
			}
		} catch {
			errors.push( packageJson.name );
		}
	}

	if ( errors.length ) {
		throw new Error( 'Packages that were uploaded incorrectly, and need manual verification:\n' + errors.join( '\n' ) );
	}

	onSuccess( '✅ All packages that returned 409 were uploaded correctly.' );
};
