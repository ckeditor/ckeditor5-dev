/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const semver = require( 'semver' );
const executeOnDependencies = require( './executeondependencies' );
const versionUtils = require( './versions' );
const getPackageJson = require( './getpackagejson' );

/**
 * Returns a list of packages to release.
 *
 * @param {Object} options
 * @param {String} options.cwd Current work directory.
 * @param {String} options.packages A relative path to the packages.
 * @param {Array.<String>} options.skipPackages Name of packages which won't be released.
 * @returns {Promise}
 */
module.exports = function getPackagesToRelease( options ) {
	const packagesToRelease = new Map();
	const packagesToCheck = new Map();

	const execOptions = {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || []
	};

	function filterPackagesToRelease( repositoryName, repositoryPath ) {
		process.chdir( repositoryPath );

		const gitVersion = versionUtils.getLastTagFromGit();
		const changelogVersion = versionUtils.getLastFromChangelog();
		const packageJson = getPackageJson();

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

	return executeOnDependencies( execOptions, filterPackagesToRelease )
		.then( ( skippedPackages ) => {
			displaySkippedPackages( skippedPackages );

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

			process.chdir( options.cwd );

			return Promise.resolve( packagesToRelease );
		} );

	function displaySkippedPackages( skippedPackages ) {
		if ( skippedPackages && !skippedPackages.length ) {
			return;
		}

		const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

		let message = 'Packages listed below have been skipped:\n';
		skippedPackages.forEach( ( packageName ) => message += `  * ${ packageName }\n` );

		logger().info( message.trim() );
	}
};
