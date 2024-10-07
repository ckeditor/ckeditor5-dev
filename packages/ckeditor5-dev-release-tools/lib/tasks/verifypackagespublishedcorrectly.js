/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { glob } from 'glob';
import fs from 'fs-extra';
import checkVersionAvailability from '../utils/checkversionavailability.js';

/**
 * Npm sometimes throws incorrect error 409 while publishing, while the package uploads correctly.
 * The purpose of the script is to validate if packages that threw 409 are uploaded correctly to npm.
 *
 * @param {object} options
 * @param {string} options.packagesDirectory Relative path to a location of packages to release.
 * @param {string} options.version Version of the current release.
 * @param {function} options.onSuccess Callback fired when function is successful.
 * @returns {Promise}
 */
export default async function verifyPackagesPublishedCorrectly( options ) {
	const { packagesDirectory, version, onSuccess } = options;
	const packagesToVerify = await glob( upath.join( packagesDirectory, '*' ), { absolute: true } );
	const errors = [];

	if ( !packagesToVerify.length ) {
		onSuccess( 'No packages found to check for upload error 409.' );

		return;
	}

	for ( const packageToVerify of packagesToVerify ) {
		const packageJson = await fs.readJson( upath.join( packageToVerify, 'package.json' ) );

		const isPackageVersionAvailable = await checkVersionAvailability( version, packageJson.name );

		if ( isPackageVersionAvailable ) {
			errors.push( packageJson.name );
		} else {
			await fs.remove( packageToVerify );
		}
	}

	if ( errors.length ) {
		throw new Error( 'Packages that were uploaded incorrectly, and need manual verification:\n' + errors.join( '\n' ) );
	}

	onSuccess( 'All packages that returned 409 were uploaded correctly.' );
}
