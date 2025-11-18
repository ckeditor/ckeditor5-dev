/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import upath from 'upath';

/**
 * Checks if all packages in the provided directories contain the `package.json` file.
 *
 * @param {Array.<string>} packagePaths
 * @param {object} options
 * @param {boolean} options.requireEntryPoint Whether to verify if packages to publish define an entry point. In other words,
 * whether their `package.json` define the `main` field.
 * @param {Array.<string>} options.optionalEntryPointPackages If the entry point validator is enabled (`requireEntryPoint=true`),
 * this array contains a list of packages that will not be checked. In other words, they do not have to define the entry point.
 * @returns {Promise}
 */
export default async function assertPackages( packagePaths, options ) {
	const errors = [];
	const { requireEntryPoint, optionalEntryPointPackages } = options;

	for ( const packagePath of packagePaths ) {
		const packageName = upath.basename( packagePath );
		const packageJsonPath = upath.join( packagePath, 'package.json' );

		if ( await fs.access( packageJsonPath ) ) {
			if ( !requireEntryPoint ) {
				continue;
			}

			const { name: packageName, main: entryPoint } = JSON.parse( await fs.readFile( packageJsonPath, 'utf-8' ) );

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
}
