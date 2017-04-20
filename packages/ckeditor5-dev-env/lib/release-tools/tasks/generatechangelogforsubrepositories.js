/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const executeOnPackages = require( '../utils/executeonpackages' );
const displayGeneratedChangelogs = require( '../utils/displaygeneratedchangelogs' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const getSubRepositoriesPaths = require( '../utils/getsubrepositoriespaths' );
const generateChangelogForSinglePackage = require( './generatechangelogforsinglepackage' );

/**
 * Generates the changelog for packages located in multi repositories.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages.
 * @param {Array.<String>} options.skipPackages Name of packages which won't be touched.
 * @returns {Promise}
 */
module.exports = function generateChangelogForSubRepositories( options ) {
	const log = logger();
	const cwd = process.cwd();

	const pathsCollection = getSubRepositoriesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || []
	} );

	const generatedChangelogsMap = new Map();

	return executeOnPackages( pathsCollection.packages, generateChangelogTask )
		.then( () => {
			process.chdir( cwd );

			displaySkippedPackages( pathsCollection.skipped );
			displayGeneratedChangelogs( generatedChangelogsMap );

			log.info( 'Done.' );
		} );

	function generateChangelogTask( dependencyName, dependencyPath ) {
		process.chdir( dependencyPath );

		return generateChangelogForSinglePackage()
			.then( ( newVersion ) => {
				if ( newVersion ) {
					generatedChangelogsMap.set( dependencyName, newVersion );
				} else {
					pathsCollection.skipped.add( dependencyPath );
				}
			} )
			.catch( ( err ) => {
				log.error( err );
			} );
	}
};
