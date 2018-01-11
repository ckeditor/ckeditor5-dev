/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const executeOnPackages = require( './executeonpackages' );
const getPackageJson = require( './getpackagejson' );
const versionUtils = require( './versions' );

/**
 * Returns a list of packages to release.
 *
 * @param {Set} pathsToPackages A collection of paths to packages.
 * @returns {Promise}
 */
module.exports = function getPackagesToRelease( pathsToPackages ) {
	const cwd = process.cwd();
	const packagesToRelease = new Map();

	function filterPackagesToRelease( repositoryPath ) {
		process.chdir( repositoryPath );

		const gitVersion = versionUtils.getLastTagFromGit();
		const changelogVersion = versionUtils.getLastFromChangelog();
		const packageJson = getPackageJson();
		const repositoryName = packageJson.name;

		if ( gitVersion !== changelogVersion ) {
			// Package is ready to release.
			packagesToRelease.set( repositoryName, {
				previousVersion: packageJson.version,
				version: changelogVersion,
			} );
		}

		return Promise.resolve();
	}

	return executeOnPackages( pathsToPackages, filterPackagesToRelease )
		.then( () => {
			process.chdir( cwd );

			return Promise.resolve( packagesToRelease );
		} );
};
