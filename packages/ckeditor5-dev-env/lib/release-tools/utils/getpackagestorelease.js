/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const executeOnPackages = require( './executeonpackages' );
const getPackageJson = require( './getpackagejson' );
const versionUtils = require( './versions' );

/**
 * Returns a list of packages which should be releases based on changes in a changelog file and tags created in Git repository.
 *
 * @param {Set} pathsToPackages A collection of paths to packages that should be checked.
 * @returns {Promise.<Map.<String, ReleaseDetails>>}
 */
module.exports = function getPackagesToRelease( pathsToPackages ) {
	const cwd = process.cwd();
	const packagesToRelease = new Map();

	return executeOnPackages( pathsToPackages, filterPackagesToRelease )
		.then( () => {
			process.chdir( cwd );

			return Promise.resolve( packagesToRelease );
		} );

	function filterPackagesToRelease( repositoryPath ) {
		process.chdir( repositoryPath );

		const gitVersion = versionUtils.getLastTagFromGit();
		const changelogVersion = versionUtils.getLastFromChangelog();
		const packageJson = getPackageJson();
		const repositoryName = packageJson.name;

		// If these versions aren't equal, it means that the package is ready to release
		// because we assume that a version from changelog is the latest.
		if ( gitVersion !== changelogVersion ) {
			packagesToRelease.set( repositoryName, {
				previousVersion: packageJson.version,
				version: changelogVersion
			} );
		}

		return Promise.resolve();
	}
};

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
