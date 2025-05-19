/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

/**
 * Returns a (CKEditor 5) package name the file belongs to.
 *
 * E.g., for the path to the file:
 *
 *        "/foo/ckeditor5/packages/ckeditor5-bar/baz.css"
 *
 * it outputs
 *
 *        "ckeditor5-bar"
 *
 * It always returns the last found package. Sometimes the whole project can be located
 * under path which starts with `ckeditor5-`. In this case it isn't a package and it doesn't make
 * sense to return the directory name. See #381.
 *
 * E.g., for the path from the package directory to the file:
 *
 *        "/foo/ckeditor5/packages/ckeditor5-editor-classic/node_modules/@ckeditor/ckeditor5-bar/baz.css"
 *
 * it outputs
 *
 *        "ckeditor5-bar"
 *
 * @param {string} inputFilePath A path to the file.
 * @returns {string} The name of the package.
 */
export default function getPackageName( inputFilePath ) {
	const match = inputFilePath.match( /^.+[/\\](ckeditor5-[^/\\]+)/ );

	if ( match ) {
		return match.pop();
	} else {
		return null;
	}
}
