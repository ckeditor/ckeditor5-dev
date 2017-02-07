/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const executeOnDependencies = require( './executeondependencies' );
const versionUtils = require( './versions' );

/**
 * Returns a list of packages to release.
 *
 * @param {Object} options
 * @params {String} options.cwd Current work directory.
 * @params {String} options.packages A relative path to the packages.
 * @returns {Promise}
 */
module.exports = function packagesToRelease( options ) {
	const packagesToRelease = new Map();
	const packagesToCheck = new Map();

	const execOptions = {
		cwd: options.cwd,
		packages: options.packages
	};

	const filterPreparedPackagesToRelease = ( repositoryName, repositoryPath ) => {
		process.chdir( repositoryPath );

		const gitVersion = versionUtils.getLastFromTag();
		const changelogVersion = versionUtils.getLastFromChangelog();

		if ( gitVersion !== changelogVersion ) {
			// Package is ready to release.
			packagesToRelease.set( repositoryName, {
				version: changelogVersion,
				hasChangelog: true
			} );
		} else {
			// Package does not have new changes but its dependencies may be changed.
			const packageJson = require( path.join( process.cwd(), 'package.json' ) );
			packagesToCheck.set( repositoryName, packageJson );
		}

		return Promise.resolve();
	};

	return executeOnDependencies( execOptions, filterPreparedPackagesToRelease )
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
							version: versionUtils.getNext( packageJson.version, 'patch' ),
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
};
