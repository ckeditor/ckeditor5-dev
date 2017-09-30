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
 * Those packages have to specified in the "main" package.json as the dependencies.
 *
 * @param {Object} options
 * @param {String} options.cwd Current work directory.
 * @param {String} options.packages A relative path to the packages.
 * @param {Array.<String>} options.skipPackages Name of packages which won't be touched.
 * @param {RegExp} [options.scope] Package name has to match to specified pattern.
 * @returns {Object.<String, Set>} collections
 */
module.exports = function getSubRepositoriesPaths( options ) {
	const packagesAbsolutePath = path.join( options.cwd, options.packages );
	const directories = tools.getDirectories( packagesAbsolutePath );
	const pathsCollection = {
		packages: new Set(),
		skipped: new Set()
	};

	const packageJson = getPackageJson( options.cwd );
	const dependencies = Object.keys( packageJson.dependencies || {} );

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
		if ( !dependencies.includes( packageName ) ) {
			return false;
		}

		if ( options.skipPackages.includes( packageName ) ) {
			return false;
		}

		if ( options.scope ) {
			return !!packageName.match( options.scope );
		}

		return true;
	}
};
