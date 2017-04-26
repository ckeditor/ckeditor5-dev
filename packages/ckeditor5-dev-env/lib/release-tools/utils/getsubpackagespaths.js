/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( './getpackagejson' );

/**
 * Returns a collection of paths to packages which are located in single repository.
 *
 * @param {Object} options
 * @param {String} options.cwd Current work directory.
 * @param {String} options.packages A relative path to the packages.
 * @param {Array.<String>} options.skipPackages Name of packages which won't be touched.
 * @returns {Object.<String, Set>} collections
 */
module.exports = function getSubPackagesPaths( options ) {
	const packagesAbsolutePath = path.join( options.cwd, options.packages );
	const directories = tools.getDirectories( packagesAbsolutePath );
	const pathsCollection = {
		packages: new Set(),
		skipped: new Set()
	};

	for ( const directory of directories ) {
		const dependencyPath = path.join( packagesAbsolutePath, directory );
		const dependencyName = getPackageJson( dependencyPath ).name;

		if ( options.skipPackages.includes( dependencyName ) ) {
			pathsCollection.skipped.add( dependencyPath );
		} else {
			pathsCollection.packages.add( dependencyPath );
		}
	}

	return pathsCollection;
};
