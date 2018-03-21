/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

// Get a path to a source file which will uniquely identify this file in
// a build directory, once all package are gathered together.
//
// In order to do that, everything up to `ckeditor-*/` is removed:
// /work/space/ckeditor5-foo/tests/manual/foo.js -> ckeditor5-foo/tests/manual/foo.js
module.exports = function getRelativeFilePath( filePath ) {
	return filePath.replace( /^.+[/\\]ckeditor5-/, 'ckeditor5-' );
};
