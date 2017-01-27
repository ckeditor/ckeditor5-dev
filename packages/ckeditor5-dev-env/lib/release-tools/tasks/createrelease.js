/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const parseGithubUrl = require( 'parse-github-url' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const createGithubRelease = require( './creategithubrelease' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const updateDependenciesVersions = require( '../utils/updatedependenciesversions' );
const utils = require( '../utils/changelog' );
const validator = require( '../utils/releasevalidator' );

/**
 * Creates a new release.
 *
 * Commits a new changelog (and package.json), creates a tag,
 * pushes the tag to a remote server and creates a note on GitHub releases page.
 *
 * This method should be executed after the `tasks.generateChangelog` method.
 *
 * @params {Object} options
 * @params {String} options.token GitHub token used to authenticate.
 * @params {Object} options.dependencies Packages with versions of CKEditor 5 dependencies.
 * @returns {Promise}
 */
module.exports = function createRelease( options ) {
	validator.checkOptions( options );

	const cwd = process.cwd();
	const shExecParams = { verbosity: 'error' };
	const log = logger();

	log.info( `Releasing: ${ cwd }` );

	tools.shExec( 'git fetch', shExecParams );
	tools.shExec( 'git status' );

	log.info( 'Checking whether on master and ready to release...' );
	validator.checkBranch();

	let version;

	const packageJsonPath = path.join( cwd, 'package.json' );
	updateDependenciesVersions( options.dependencies, packageJsonPath );

	return getNewReleaseType()
		.then( ( response ) => {
			const bumpVersionCommand = `npm version ${ response.releaseType } --no-git-tag-version --force`;
			version = tools.shExec( bumpVersionCommand, shExecParams ).trim();

			const latestChanges = utils.getChangesForVersion( version );

			log.info( `Committing "${ utils.changelogFile }" and "package.json"...` );
			tools.shExec( `git add package.json ${ utils.changelogFile }`, shExecParams );
			tools.shExec( `git commit --message="Release: ${ version }."`, shExecParams );

			log.info( 'Creating tag...' );
			tools.shExec( `git tag ${ version }`, shExecParams );
			tools.shExec( `git push origin master ${ version }`, shExecParams );

			log.info( 'Creating GitHub release...' );

			const repositoryInfo = parseGithubUrl(
				tools.shExec( 'git remote get-url origin --push', shExecParams ).trim()
			);

			return createGithubRelease( options.token, {
				repositoryOwner: repositoryInfo.owner,
				repositoryName: repositoryInfo.name,
				version: version,
				description: latestChanges
			} );
		} )
		.then( () => {
			log.info( `Release "${ version }" has been created and published.` );
		} );
};
