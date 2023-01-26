/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const minimatch = require( 'minimatch' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const getPackageJson = require( './getpackagejson' );

/**
 * Returns an object with two collections of paths to packages which are located in single repository.
 * Those packages must be defined as dependencies in the repository found in `options.cwd`.
 *
 *   - The first one is marked as `matched` and means that packages specified in a path (which is a combination of values specified as
 *     `options.cwd` and  `options.packages`) match to given criteria.
 *   - The second one is marked as `skipped` and means that packages should not be processed. They were listed as packages to skip
 *     (`options.skipPackages` or don't mach to `options.scope`).
 *
 * @param {Object} options
 * @param {String} options.cwd Current work directory.
 * @param {String|null} options.packages Name of directory where to look for packages. If `null`, only repository specified under
 * `options.cwd` will be returned.
 * @param {String|Array.<String>} options.skipPackages Glob pattern(s) which describes which packages should be skipped.
 * @param {String} [options.scope] Package names have to match to specified glob pattern.
 * @param {Boolean} [options.skipMainRepository=false] If set on true, package found in `options.cwd` will be skipped.
 * @returns {PathsCollection}
 */
module.exports = function getPackagesPaths( options ) {
	const pathsCollection = {
		matched: new Set(),
		skipped: new Set()
	};

	if ( options.skipMainRepository ) {
		pathsCollection.skipped.add( options.cwd );
	} else {
		pathsCollection.matched.add( options.cwd );
	}

	if ( !options.packages ) {
		return pathsCollection;
	}

	const packagesPath = path.join( options.cwd, options.packages );
	const skipPackages = Array.isArray( options.skipPackages ) ? options.skipPackages : [ options.skipPackages ];

	for ( const directory of tools.getDirectories( packagesPath ) ) {
		const dependencyPath = path.join( packagesPath, directory );

		try {
			const dependencyName = getPackageJson( dependencyPath ).name;

			if ( isValidPackage( dependencyName ) ) {
				pathsCollection.matched.add( dependencyPath );
			} else {
				pathsCollection.skipped.add( dependencyPath );
			}
		} catch ( err ) {
			/* istanbul ignore next */
			console.warn( `Missing "package.json file in "${ dependencyPath }". Skipping.` );
		}
	}

	return pathsCollection;

	function isValidPackage( packageName ) {
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

/**
 * @typedef {Object} PathsCollection
 *
 * @property {Set.<String>} matched Packages that match given criteria.
 *
 * @property {Set.<String>} skipped Packages that do not match given criteria.
 */
