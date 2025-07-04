/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import { minimatch } from 'minimatch';
import { tools, workspaces } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Returns an object with two collections of paths to packages which are located in single repository.
 * Those packages must be defined as dependencies in the repository found in `options.cwd`.
 *
 *   - The first one is marked as `matched` and means that packages specified in a path (which is a combination of values specified as
 *     `options.cwd` and `options.packages`) match to given criteria.
 *   - The second one is marked as `skipped` and means that packages should not be processed. They were listed as packages to skip
 *     (`options.skipPackages` or don't mach to `options.scope`).
 *
 * @param {object} options
 * @param {string} options.cwd Current work directory.
 * @param {string|null} options.packages Name of directory where to look for packages. If `null`, only repository specified under
 * `options.cwd` will be returned.
 * @param {string|Array.<string>} options.skipPackages Glob pattern(s) which describes which packages should be skipped.
 * @param {string} [options.scope] Package names have to match to specified glob pattern.
 * @param {boolean} [options.skipMainRepository=false] If set on true, package found in `options.cwd` will be skipped.
 * @returns {PathsCollection}
 */
export default function getPackagesPaths( options ) {
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
			const { name: dependencyName } = workspaces.getPackageJson( dependencyPath );

			if ( isValidPackage( dependencyName ) ) {
				pathsCollection.matched.add( dependencyPath );
			} else {
				pathsCollection.skipped.add( dependencyPath );
			}
		} catch {
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
}

/**
 * @typedef {object} PathsCollection
 *
 * @property {Set.<string>} matched Packages that match given criteria.
 *
 * @property {Set.<string>} skipped Packages that do not match given criteria.
 */
