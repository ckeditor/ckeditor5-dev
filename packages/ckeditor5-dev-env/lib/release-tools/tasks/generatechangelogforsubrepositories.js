/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const chalk = require( 'chalk' );
const executeOnPackages = require( '../utils/executeonpackages' );
const displayGeneratedChangelogs = require( '../utils/displaygeneratedchangelogs' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const getPackageJson = require( '../utils/getpackagejson' );
const generateChangelogForSinglePackage = require( './generatechangelogforsinglepackage' );

/**
 * Generates the changelog for packages located in multi repositories.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages.
 * @param {String} [options.scope] Package names have to match to specified glob pattern.
 * @param {Array.<String>} [options.skipPackages=[]] Name of packages which won't be touched.
 * @param {String} [options.newVersion=null] If specified, the tool will use the version. User won't be able to provide
 * its version based on history of commits.
 * @returns {Promise}
 */
module.exports = function generateChangelogForSubRepositories( options ) {
	const log = logger();
	const cwd = process.cwd();

	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		scope: options.scope || null,
		skipPackages: options.skipPackages || []
	} );

	const newVersion = options.newVersion || null;

	const generatedChangelogsMap = new Map();
	const skippedChangelogs = new Set();

	return executeOnPackages( pathsCollection.packages, generateChangelogTask )
		.then( () => {
			log.info( '' );
			log.info( chalk.underline( 'Checking whether dependencies of skipped packages have changed...' ) );

			const internalChangelogsPaths = new Map();

			let clearRun = false;

			while ( !clearRun ) {
				clearRun = true;

				for ( const packagePath of skippedChangelogs ) {
					const packageJson = getPackageJson( packagePath );

					// Check whether the dependencies will be released.
					const willUpdateDependencies = Object.keys( packageJson.dependencies || {} )
						.some( dependencyName => {
							return generatedChangelogsMap.has( dependencyName ) || internalChangelogsPaths.has( dependencyName );
						} );

					// If so, bump the patch version for current package and release it too.
					if ( willUpdateDependencies ) {
						internalChangelogsPaths.set( packageJson.name, packagePath );
						skippedChangelogs.delete( packagePath );
						clearRun = false;
					}
				}
			}

			return executeOnPackages( internalChangelogsPaths.values(), generateInternalChangelogTask );
		} )
		.then( () => {
			process.chdir( cwd );

			displaySkippedPackages( new Set( [
				...pathsCollection.skipped,
				...skippedChangelogs
			].sort() ) );

			displayGeneratedChangelogs( generatedChangelogsMap );

			log.info( 'Done.' );
		} );

	function generateChangelogTask( dependencyPath ) {
		process.chdir( dependencyPath );

		return generateChangelogForSinglePackage( { newVersion } )
			.then( newVersionInChangelog => {
				if ( newVersionInChangelog ) {
					generatedChangelogsMap.set( getPackageJson( dependencyPath ).name, newVersionInChangelog );
				} else {
					skippedChangelogs.add( dependencyPath );
				}
			} )
			.catch( err => {
				log.error( err );
			} );
	}

	function generateInternalChangelogTask( dependencyPath ) {
		process.chdir( dependencyPath );

		return generateChangelogForSinglePackage( { newVersion: 'internal' } )
			.then( newVersion => {
				generatedChangelogsMap.set( getPackageJson( dependencyPath ).name, newVersion );
			} )
			.catch( err => {
				log.error( err );
			} );
	}
};
