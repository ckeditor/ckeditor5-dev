/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Get a path to a source file which will uniquely identify this file in
 * a build directory, once all packages are gathered together.
 *
 * In order to do that, everything up to `ckeditor5?-packageName` is removed:
 * /work/space/ckeditor5/tests/manual/foo.js -> ckeditor5/tests/manual/foo.js
 * /work/space/ckeditor/tests/manual/foo.js -> ckeditor/tests/manual/foo.js
 * /work/space/ckeditor5-foo/tests/manual/foo.js -> ckeditor5-foo/tests/manual/foo.js
 * /work/space/ckeditor-foo/tests/manual/foo.js -> ckeditor-foo/tests/manual/foo.js
 *
 * @param {String} filePath
 * @returns {String}
 */
module.exports = function getRelativeFilePath( filePath ) {
	return filePath.replace( /^.+[/\\]ckeditor(5)?(-)?/, ( ...match ) => {
		const ckeditor = match[ 1 ] ? 'ckeditor5' : 'ckeditor';

		return match[ 2 ] ? `${ ckeditor }-` : ckeditor;
	} );
};
