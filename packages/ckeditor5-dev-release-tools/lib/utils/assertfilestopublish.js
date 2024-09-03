/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import upath from 'upath';
import { glob } from 'glob';

/**
 * Checks if all files expected to be released actually exist in the package directory. Verification takes place for all packages.
 *
 * @param {String} packagePaths
 * @param {Object.<String, Array.<String>>|null} optionalEntries
 * @returns {Promise}
 */
export default async function assertFilesToPublish( packagePaths, optionalEntries ) {
	const errors = [];

	for ( const packagePath of packagePaths ) {
		const requiredEntries = [];
		const packageJsonPath = upath.join( packagePath, 'package.json' );
		const packageJson = await fs.readJson( packageJsonPath );

		if ( packageJson.main ) {
			requiredEntries.push( packageJson.main );
		}

		if ( packageJson.types ) {
			requiredEntries.push( packageJson.types );
		}

		if ( packageJson.files ) {
			requiredEntries.push( ...getRequiredEntries( packageJson.files, packageJson.name, optionalEntries ) );
		}

		const unmatchedEntries = [];

		for ( const requiredEntry of requiredEntries ) {
			// To match a directory or a file using a single `requiredEntry` pattern.
			const foundFiles = await glob( [ requiredEntry, requiredEntry + '/**' ], {
				cwd: packagePath,
				dot: true,
				nodir: true
			} );

			if ( foundFiles.length === 0 ) {
				unmatchedEntries.push( requiredEntry );
			}
		}

		if ( unmatchedEntries.length ) {
			errors.push( `Missing files in "${ packageJson.name }" package for entries: "${ unmatchedEntries.join( '", "' ) }"` );
		}
	}

	if ( errors.length ) {
		throw new Error( errors.join( '\n' ) );
	}
}

/**
 * Filters out the optional entries from the `files` field and returns only the required ones.
 *
 * @param {Array.<String>} entries
 * @param {String} packageName
 * @param {Object.<String, Array.<String>>|null} optionalEntries
 * @returns {Array.<String>}
 */
function getRequiredEntries( entries, packageName, optionalEntries ) {
	if ( !optionalEntries ) {
		return entries;
	}

	return entries.filter( entry => {
		if ( optionalEntries[ packageName ] ) {
			return !optionalEntries[ packageName ].includes( entry );
		}

		if ( optionalEntries.default ) {
			return !optionalEntries.default.includes( entry );
		}

		return true;
	} );
}
