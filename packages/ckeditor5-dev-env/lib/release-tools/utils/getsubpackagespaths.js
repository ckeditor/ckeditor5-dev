/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( './getpackagejson' );
const minimatch = require( 'minimatch' );

/**
 * Returns a collection of paths to packages which are located in single repository.
 *
 * @param {Object} options
 * @param {String} options.cwd Current work directory.
 * @param {String} options.packages A relative path to the packages.
 * @param {String|Array.<String>} options.skipPackages Name or glob pattern of packages which won't be touched.
 * @param {String} [options.scope] Package names have to match to specified glob pattern.
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

		if ( isValidPackage( dependencyName ) ) {
			pathsCollection.packages.add( dependencyPath );
		} else {
			pathsCollection.skipped.add( dependencyPath );
		}
	}

	return pathsCollection;

	function isValidPackage( packageName ) {
		const skipPackages = Array.isArray( options.skipPackages ) ? options.skipPackages : [ options.skipPackages ];

		for ( const skipPackageGlob of skipPackages ) {
			if ( minimatch( packageName, skipPackageGlob ) ) {
				return false;
			}
		}

		if ( options.scope ) {
			return minimatch( packageName, options.scope );
		}

		return true;
	}
};
