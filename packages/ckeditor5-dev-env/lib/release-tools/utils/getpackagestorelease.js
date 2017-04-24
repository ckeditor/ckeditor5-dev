/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const semver = require( 'semver' );
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
	const packagesToCheck = new Map();

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
				hasChangelog: true
			} );
		} else {
			// Package does not have new changes but its dependencies may be changed.
			packagesToCheck.set( repositoryName, packageJson );
		}

		return Promise.resolve();
	}

	return executeOnPackages( pathsToPackages, filterPackagesToRelease )
		.then( () => {
			let clearRun = false;

			while ( !clearRun ) {
				clearRun = true;

				for ( const [ packageName, packageJson ] of packagesToCheck ) {
					// Check whether the dependencies will be released.
					let willUpdateDependencies = Object.keys( packageJson.dependencies || {} )
						.some( ( dependencyName ) => packagesToRelease.has( dependencyName ) );

					// If so, bump the patch version for current package and release it too.
					if ( willUpdateDependencies ) {
						packagesToRelease.set( packageName, {
							previousVersion: packageJson.version,
							version: semver.inc( packageJson.version, 'patch' ),
							hasChangelog: false
						} );

						packagesToCheck.delete( packageName );
						clearRun = false;
					}
				}
			}

			process.chdir( cwd );

			return Promise.resolve( packagesToRelease );
		} );
};
