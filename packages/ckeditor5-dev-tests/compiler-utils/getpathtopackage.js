/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );

/**
 * @param {String} root Root of the workspace
 * @param {String} name Name of the package.
 * @returns {String} Path to package.
 */
module.exports = function getPathToPackage( root, name ) {
	const pathToPackage = path.join( root, 'ckeditor5-' + name );

	if ( !fs.existsSync( pathToPackage ) ) {
		throw new Error( `Missing package: ckeditor5-${ name } in ${ path.join( __dirname, '..', '..' ) }.` );
	}

	return pathToPackage;
};

