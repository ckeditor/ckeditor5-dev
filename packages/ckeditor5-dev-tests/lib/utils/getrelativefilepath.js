/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * Get a path to a source file which will uniquely identify this file in
 * a build directory, once all packages are gathered together.
 *
 * E.g.:
 *   - /work/space/ckeditor5/tests/manual/foo.js -> ckeditor5/tests/manual/foo.js
 *   - /work/space/ckeditor/tests/manual/foo.js -> ckeditor/tests/manual/foo.js
 *   - /work/space/packages/ckeditor5-foo/tests/manual/foo.js -> ckeditor5-foo/tests/manual/foo.js
 *   - /work/space/packages/ckeditor-foo/tests/manual/foo.js -> ckeditor-foo/tests/manual/foo.js
 *
 * @param {String} filePath
 * @param {String} [cwd=process.cwd()]
 * @returns {String}
 */
module.exports = function getRelativeFilePath( filePath, cwd = process.cwd() ) {
	// The path ends with the directory separator.
	const relativePath = filePath.replace( cwd, '' ).slice( 1 );

	// A package.
	if ( relativePath.startsWith( 'packages' ) ) {
		return relativePath.replace( 'packages', '' ).slice( 1 );
	}

	// The main repository.
	return path.join( 'ckeditor5', relativePath );
};
