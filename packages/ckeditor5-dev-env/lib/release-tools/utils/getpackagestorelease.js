/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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

		const newVersion = findVersionInChangelog( options.changes, repositoryName ) || options.version;

		// If these versions aren't equal, it means that the package is ready to release
		// because we assume that a version from `package.json` is the latest.
		if ( packageJson.version !== newVersion ) {
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
//      [packageName](https://www.npmjs.com/package/packageName): v0.0.1 => [v1.0.0](https://github.com/.../releases/tag/v1.0.0)
//
// where:
//   `v0.0.1` is the current version (already published),
//   `v1.0.0` is the new version what we're looking for.
//
// @param {String} changelog Changes.
// @param {String} packageName Package to look.
// @returns {String|null} `null` if the version was not found.
function findVersionInChangelog( changelog, packageName ) {
	const versionRegexp = new RegExp( `\\[${ packageName.replace( '/', '\\/' ) }\\].*\\[v([\\d.]+)\\]` );
	const match = changelog.match( versionRegexp );

	return match ? match[ 1 ] : null;
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
