/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import upath from 'upath';

/**
 * Returns object from `package.json`.
 *
 * This function is helpful for testing the whole process. Allows mocking the file
 * instead of create the fixtures.
 *
 * @param {string} [cwd=process.cwd()] Where to look for package.json.
 * @returns {object}
 */
export default function getPackageJson( cwd = process.cwd() ) {
	let pkgJsonPath = cwd;

	if ( !pkgJsonPath.endsWith( 'package.json' ) ) {
		pkgJsonPath = upath.join( cwd, 'package.json' );
	}

	return JSON.parse( fs.readFileSync( pkgJsonPath, 'utf-8' ) );
}
