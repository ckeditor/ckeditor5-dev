/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import getPackageJson from './getpackagejson.js';
import { CLI_INDENT_SIZE } from './constants.js';

/**
 * Displays skipped packages.
 *
 * @param {Set} skippedPackagesPaths
 */
export default function displaySkippedPackages( skippedPackagesPaths ) {
	if ( !skippedPackagesPaths.size ) {
		return;
	}

	const indent = ' '.repeat( CLI_INDENT_SIZE );

	const packageNames = Array.from( skippedPackagesPaths )
		.map( packagePath => getPackageJson( packagePath ).name );

	let message = indent + chalk.bold.underline( 'Packages listed below have been skipped:' ) + '\n';
	message += packageNames.map( line => indent + `  * ${ line }` ).join( '\n' );

	logger().info( message );
}
