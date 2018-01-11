/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const semver = require( 'semver' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const cli = require( '../utils/cli' );
const versionUtils = require( '../utils/versions' );
const changelogUtils = require( '../utils/changelog' );
const displaySkippedPackages = require( '../utils/displayskippedpackages' );
const displayGeneratedChangelogs = require( '../utils/displaygeneratedchangelogs' );
const executeOnPackages = require( '../utils/executeonpackages' );
const getPackageJson = require( '../utils/getpackagejson' );
const getSubPackagesPaths = require( '../utils/getsubpackagespaths' );
const generateChangelogFromCommits = require( '../utils/generatechangelogfromcommits' );
const transformCommitFunction = require( '../utils/transform-commit/transformcommitforsubpackage' );

/**
 * Generates the changelog for packages located in single repository.
 *
 * @param {Object} options
 * @param {String} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @param {String} options.packages Where to look for other packages.
 * @param {Array.<String>} options.skipPackages Name of packages which won't be touched.
 * @returns {Promise}
 */
module.exports = function generateChangelogForSubPackages( options ) {
	const log = logger();
	const cwd = process.cwd();

	const pathsCollection = getSubPackagesPaths( {
		cwd: options.cwd,
		packages: options.packages,
		skipPackages: options.skipPackages || []
	} );

	const skippedPackages = new Set();
	const generatedChangelogsMap = new Map();

	return executeOnPackages( pathsCollection.packages, generateChangelogTask )
		.then( () => {
			process.chdir( cwd );

			// No changelog has generated. Abort.
			if ( skippedPackages.size === pathsCollection.packages.size ) {
				return;
			}

			const shExecOptions = { verbosity: 'error' };

			log.info( 'Committing generated changelogs.' );

			tools.shExec( `git add ${ options.packages }/**/${ changelogUtils.changelogFile }`, shExecOptions );
			tools.shExec( 'git commit -m "Docs: Updated changelog for packages. [skip ci]"', shExecOptions );
		} )
		.then( () => {
			displaySkippedPackages( pathsCollection.skipped );
			displayGeneratedChangelogs( generatedChangelogsMap );

			log.info( 'Done.' );
		} );

	function generateChangelogTask( dependencyPath ) {
		process.chdir( dependencyPath );

		const packageJson = getPackageJson();
		const dependencyName = packageJson.name;
		let tagName = versionUtils.getLastFromChangelog();

		if ( tagName ) {
			tagName = packageJson.name + '@' + tagName;
		}

		log.info( '' );
		log.info( chalk.bold.blue( `Generating changelog for "${ dependencyName }"...` ) );

		return getNewReleaseType( transformCommitFunction, { tagName } )
			.then( response => {
				const newReleaseType = response.releaseType !== 'skip' ? response.releaseType : null;

				return cli.provideVersion( packageJson.version, newReleaseType );
			} )
			.then( version => {
				if ( version === 'skip' ) {
					pathsCollection.skipped.add( dependencyPath );
					skippedPackages.add( dependencyPath );

					return Promise.resolve();
				}

				let isInternalRelease = false;

				if ( version === 'internal' ) {
					isInternalRelease = true;
					version = semver.inc( packageJson.version, 'patch' );
				}

				const changelogOptions = {
					version,
					tagName,
					isInternalRelease,
					newTagName: packageJson.name + '@' + version,
					transformCommit: transformCommitFunction
				};

				return generateChangelogFromCommits( changelogOptions )
					.then( newVersion => {
						generatedChangelogsMap.set( dependencyName, newVersion );
					} );
			} )
			.catch( err => {
				log.error( err );
			} );
	}
};
