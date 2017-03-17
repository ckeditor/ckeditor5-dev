/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * @param {Array.<String>} skippedPackages
 */
module.exports = function displaySkippedPackages( skippedPackages ) {
	if ( !Array.isArray( skippedPackages ) || !skippedPackages.length ) {
		return;
	}

	const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

	let message = 'Packages listed below have been skipped:\n';
	message += skippedPackages.map( ( line ) => `  * ${ line }` ).join( '\n' );

	logger().info( message );
};
