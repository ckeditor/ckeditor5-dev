/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Returns `true` if any of the source files represent a DLL test.
 *
 * @param {String|Array.<String>} sourceFiles
 * @returns {Boolean}
 */
module.exports = function requireDll( sourceFiles ) {
	sourceFiles = Array.isArray( sourceFiles ) ? sourceFiles : [ sourceFiles ];

	return sourceFiles.some( filePath => /-dll.[jt]s$/.test( filePath ) );
};
