/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( './getpackagejson' );
const { INDENT_SIZE } = require( './cli' );

/**
 * Displays skipped packages.
 *
 * @param {Set} skippedPackagesPaths
 */
module.exports = function displaySkippedPackages( skippedPackagesPaths ) {
	if ( !skippedPackagesPaths.size ) {
		return;
	}

	const indent = ' '.repeat( INDENT_SIZE );

	const packageNames = Array.from( skippedPackagesPaths )
		.map( packagePath => getPackageJson( packagePath ).name );

	let message = indent + chalk.bold.underline( 'Packages listed below have been skipped:' ) + '\n';
	message += packageNames.map( line => indent + `  * ${ line }` ).join( '\n' );

	logger().info( message );
};
