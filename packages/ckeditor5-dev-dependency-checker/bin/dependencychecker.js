#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import minimist from 'minimist';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import checkDependencies from '../lib/checkdependencies.js';

const { packagePaths, options } = parseArguments( process.argv.slice( 2 ) );

checkDependencies( packagePaths, options )
	.then( foundError => {
		if ( foundError ) {
			process.exitCode = 1;
		}
	} );

/**
 * Parses CLI arguments and options.
 *
 * @param {Array.<string>} args CLI arguments containing package paths and options.
 * @returns {object} result
 * @returns {Set.<string>} result.packagePaths Relative package paths.
 * @returns {Object.<string, Boolean>} result.options Configuration options.
 */
function parseArguments( args ) {
	const config = {
		boolean: [
			'quiet'
		],

		default: {
			quiet: false
		}
	};

	const parsedArgs = minimist( args, config );

	const options = Object.assign( {}, parsedArgs );

	// Delete arguments that didn't have an explicit option associated with them.
	// In our case this is all package paths.
	delete options._;

	return {
		packagePaths: getPackagePaths( parsedArgs._ ),
		options
	};
}

/**
 * Returns relative (to the current work directory) paths to packages. If the provided `args` array is empty,
 * the packages will be read from the `packages/` directory.
 *
 * @param {Array.<string>} args CLI arguments with relative or absolute package paths.
 * @returns {Set.<string>} Relative package paths.
 */
function getPackagePaths( args ) {
	if ( !args.length ) {
		return tools.getDirectories( path.join( process.cwd(), 'packages' ) )
			.map( packageName => `packages/${ packageName }` );
	}

	const PACKAGE_RELATIVE_PATH_REGEXP = /packages\/ckeditor5?-[^/]+/;

	const getPackageRelativePathFromAbsolutePath = path => {
		const found = path.match( PACKAGE_RELATIVE_PATH_REGEXP );

		return found ? found[ 0 ] : '';
	};

	const isPackageRelativePath = path => !!path && PACKAGE_RELATIVE_PATH_REGEXP.test( path );

	return args.reduce( ( paths, arg ) => {
		const relativePath = path.isAbsolute( arg ) ? getPackageRelativePathFromAbsolutePath( arg ) : arg;

		if ( isPackageRelativePath( relativePath ) ) {
			paths.add( relativePath );
		}

		return paths;
	}, new Set() );
}
