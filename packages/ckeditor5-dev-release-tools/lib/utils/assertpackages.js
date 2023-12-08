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
 * @param {Object} options
 * @param {Boolean} options.requireEntryPoint Whether to verify if packages to publish define an entry point. In other words,
 * whether their `package.json` define the `main` field.
 * @param {Array.<String>} options.optionalEntryPointPackages If the entry point validator is enabled (`requireEntryPoint=true`),
 * this array contains a list of packages that will not be checked. In other words, they do not have to define the entry point.
 * @returns {Promise}
 */
module.exports = async function assertPackages( packagePaths, options ) {
	const errors = [];
	const { requireEntryPoint, optionalEntryPointPackages } = options;

	for ( const packagePath of packagePaths ) {
		const packageName = upath.basename( packagePath );
		const packageJsonPath = upath.join( packagePath, 'package.json' );

		if ( await fs.pathExists( packageJsonPath ) ) {
			if ( !requireEntryPoint ) {
				continue;
			}

			const { name: packageName, main: entryPoint } = await fs.readJson( packageJsonPath );

			if ( optionalEntryPointPackages.includes( packageName ) ) {
				continue;
			}

			if ( !entryPoint ) {
				errors.push( `The "${ packageName }" package misses the entry point ("main") definition in its "package.json".` );
			}
		} else {
			errors.push( `The "package.json" file is missing in the "${ packageName }" package.` );
		}
	}

	if ( errors.length ) {
		throw new Error( errors.join( '\n' ) );
	}
};
