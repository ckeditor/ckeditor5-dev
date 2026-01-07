/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Returns `true` if any of the source files represent a DLL test.
 *
 * @param {string|Array.<string>} sourceFiles
 * @returns {boolean}
 */
export default function requireDll( sourceFiles ) {
	sourceFiles = Array.isArray( sourceFiles ) ? sourceFiles : [ sourceFiles ];

	return sourceFiles.some( filePath => /-dll.[jt]s$/.test( filePath ) );
}
