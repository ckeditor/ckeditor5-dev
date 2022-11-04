/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Returns `true` if any of the source files represent a DLL test.
 *
 * @param {Array.<String>} sourceFiles
 * @returns {Boolean}
 */
module.exports = function requireDll( sourceFiles ) {
	return sourceFiles.some( filePath => /-dll.[jt]s$/.test( filePath ) );
};
