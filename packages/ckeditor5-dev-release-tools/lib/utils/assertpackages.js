/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const upath = require( 'upath' );

/**
 * Checks if all packages in the provided directories contain the `package.json` file.
 *
 * @param {Array.<String>} packagePaths
 * @returns {Promise}
 */
module.exports = async function assertPackages( packagePaths ) {
	const errors = [];

	for ( const packagePath of packagePaths ) {
		const packageName = upath.basename( packagePath );
		const packageJsonPath = upath.join( packagePath, 'package.json' );

		if ( await fs.pathExists( packageJsonPath ) ) {
			continue;
		}

		errors.push( `The "package.json" file is missing in the "${ packageName }" package.` );
	}

	if ( errors.length ) {
		return Promise.reject( errors.join( '\n' ) );
	}
};
