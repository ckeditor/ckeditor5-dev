/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * Gets path relative to workspace directory and returns its packageName and path to its package.
 *
 * 	getWorkspaceRelativePathInfo('ckeditor5-utils/src/document.js')
 *
 * @param {String} relativePath
 * @returns {Object}
 */
module.exports = function getWorkspaceRelativePathInfo( relativePath ) {
	const splitPath = relativePath.split( path.sep );

	return {
		packageName: splitPath[ 0 ],
		filePath: path.join( ...splitPath.slice( 1 ) )
	};
};
