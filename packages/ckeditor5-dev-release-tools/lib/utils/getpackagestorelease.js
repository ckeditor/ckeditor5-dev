/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const executeOnPackages = require( './executeonpackages' );
const getPackageJson = require( './getpackagejson' );

/**
 * Returns a list of packages which should be releases based on changes in a changelog file and tags created in Git repository.
 *
 * @param {Set} pathsToPackages A collection of paths to packages that should be checked.
 * @param {Object} options
 * @param {String} options.changes A description of changes for the main repository. It should contain a script-friendly list that provides
 * new versions for parsed packages. If didn't find, `options.version` will be used instead.
 * @param {String} options.version New version for the main repository.
 * @returns {Promise.<Map.<String, ReleaseDetails>>}
 */
module.exports = function getPackagesToRelease( pathsToPackages, options ) {
	const cwd = process.cwd();
	const packagesToRelease = new Map();

	return executeOnPackages( pathsToPackages, filterPackagesToRelease )
		.then( () => {
			process.chdir( cwd );

			return Promise.resolve( packagesToRelease );
		} );

	function filterPackagesToRelease( repositoryPath ) {
		process.chdir( repositoryPath );

		const packageJson = getPackageJson();
		const repositoryName = packageJson.name;

		let newVersion;

		// For the main package/repository use the version specified as `options.cwd`.
		// For the rest packages, find a version in the changelog file.
		if ( repositoryPath === cwd ) {
			newVersion = options.version;
		} else {
			newVersion = findVersionInChangelog( options.changes, repositoryName );
		}

		// If these versions aren't equal, it means that the package is ready to release
		// because we assume that a version from `package.json` is the latest.
		if ( newVersion && packageJson.version !== newVersion ) {
			packagesToRelease.set( repositoryName, {
				previousVersion: packageJson.version,
				version: newVersion
			} );
		}

		return Promise.resolve();
	}
};

// Search for a new version for specified package in the main changelog description.
// It must be defined as following:
//
//      [packageName](https://www.npmjs.com/package/packageName): v0.0.1 => v1.0.0
//
// where:
//   `v0.0.1` is the current version (already published),
//   `v1.0.0` is the new version what we're looking for.
//
// or:
//
//      [packageName](https://www.npmjs.com/package/packageName): v0.0.1
//
// where:
//   `v0.0.1` is the current version (not published yet).
//
// The function handles pre-release, so, e.g. `v1.0.0.alpha.0` is also a proper input.
//
// Keep in mind that the dash (`-`) is a separator of the pre-release. Other characters are not allowed
// and npm will not publish a package if its version does not contain the symbol.
//
// @param {String} changelog Changes.
// @param {String} packageName Package to look.
// @returns {String|null} `null` if the version was not found.
function findVersionInChangelog( changelog, packageName ) {
	// Pick: `x.y.z` or `x.y.z-prerelease.n`, assumptions: `x, y, z, n = { 0, 1, 2, ... }`.
	const semVer = '\\d+\\.\\d+\\.\\d+(.[a-z\\d.]+)?';

	const existingPackageRegExp = new RegExp( `\\[${ packageName.replace( '/', '\\/' ) }\\].*v(${ semVer })+\\ (=>) v(${ semVer })` );
	// Groups:
	// 1. Previous version.
	// 2. Previous version - pre-release part.
	// 3. "=>" character that suggests that the package exists on npm.
	// 4. New version.
	// 5. New version - pre-release part.

	let match = changelog.match( existingPackageRegExp );

	// The package exists on npm.
	if ( match ) {
		// The version does not match to `x.y.z-prerelease.n`, npm will not allow publish it.
		if ( match[ 5 ] && !match[ 5 ].startsWith( '-' ) ) {
			return null;
		}

		return match[ 4 ];
	}

	// At this stage, we know that it will be the first release of `packageName`.
	// If the specified version is correct, let's use it.
	const newPackageRegExp = new RegExp( `\\[${ packageName.replace( '/', '\\/' ) }\\].*v(${ semVer })` );
	// Groups:
	// 1. New version.
	// 2. New version - pre-release part.

	match = changelog.match( newPackageRegExp );

	if ( !match ) {
		return null;
	}

	// The version does not match to `x.y.z-prerelease.n`, npm will not allow publish it.
	if ( match[ 2 ] && !match[ 2 ].startsWith( '-' ) ) {
		return null;
	}

	return match[ 1 ];
}

/**
 * @typedef {Object} ReleaseDetails
 *
 * @property {String} version The latest version of the package.
 *
 * @property {String|null} [previousVersion] Previous version of the package.
 *
 * @property {String} [changes] Description of changes for specified `version`. Should be taken from the changelog file.
 *
 * @property {String} [repositoryOwner] A name of organization that publishes the repository.
 * E.g. for "ckeditor/ckeditor5" it is "ckeditor".
 *
 * @property {String} [repositoryName] A name of the repository.
 * E.g. for "ckeditor/ckeditor5" it is "ckeditor5".
 *
 * @property {String} [npmVersion] The latest version of package published on NPM.
 *
 * @property {Boolean} [shouldReleaseOnNpm] Whether the package should be published on NPM.
 *
 * @property {String} [githubVersion] The latest version of package published on Github.
 *
 * @property {Boolean} [shouldReleaseOnGithub] Whether the package should have created a release on GitHub..
 */
