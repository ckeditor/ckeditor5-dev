/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( './getpackagejson' );

/**
 * Displays skipped packages.
 *
 * @param {Set} skippedPackagesPaths
 */
module.exports = function displaySkippedPackages( skippedPackagesPaths ) {
	if ( !skippedPackagesPaths.size ) {
		return;
	}

	const packageNames = Array.from( skippedPackagesPaths )
		.map( ( packagePath ) => getPackageJson( packagePath ).name );

	let message = 'Packages listed below have been skipped:\n';
	message += packageNames.map( ( line ) => `  * ${ line }` ).join( '\n' );

	logger().info( message );
};
