/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const gitHubUrl = require( 'parse-github-url' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const createGithubRelease = require( './creategithubrelease' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const utils = require( '../utils/changelog' );

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
 * @params {Boolean} options.init Whether to create first release using this package.
 * @params {Object} options.dependencies Dependencies with versions of other CKEditor5 package.
 * @returns {Promise}
 */
module.exports = function createRelease( options ) {
	if ( !options.token ) {
		throw new Error( 'GitHub CLI token not found. Use --token=<token>.' );
	}

	const cwd = process.cwd();

	console.log( `\nParsing: ${ cwd }\n` );

	const packageJsonPath = path.join( cwd, 'package.json' );
	const packageJson = require( packageJsonPath );

	if ( !packageJson.repository ) {
		throw new Error( 'The "package.json" file must contain URL to the repository.' );
	}

	const shExecParams = { verbosity: 'info' };
	const log = logger();

	log.info( 'Checking current branch...' );

	const currentBranch = tools.shExec( `git rev-parse --abbrev-ref HEAD`, shExecParams ).trim();

	if ( currentBranch !== 'master' ) {
		throw new Error( 'Release can be create only from the main branch.' );
	}

	log.info( 'Checking whether to master is up to date...' );

	tools.shExec( 'git fetch', shExecParams );

	const shortStatus = tools.shExec( `git status -sb`, shExecParams ).trim().match( /behind (\d+)/ );

	if ( shortStatus && shortStatus[ 1 ] !== 0 ) {
		throw new Error( 'Branch "master" is not up to date...' );
	}

	log.info( 'Checking whether to working directory is clean...' );

	const anyChangedFiles = tools.shExec( `git status -s`, shExecParams )
		.split( `\n` )
		.filter( ( fileName ) => !fileName.match( new RegExp( `${ utils.changelogFile }|package.json` ) ) )
		.join( `\n` )
		.trim();

	if ( anyChangedFiles.length ) {
		throw new Error( 'Working directory contains uncommitted changes...' );
	}

	let lastTag;
	let version;

	// If the release is not marked as initial.
	if ( !options.init ) {
		// Try to find the last tag.
		const tagList = tools.shExec( 'git tag --list', shExecParams ).trim();

		if ( tagList ) {
			lastTag = tools.shExec( 'git describe --tags `git rev-list --tags --max-count=1`', shExecParams ).trim();
		}
	}

	const packageNames = Object.keys( options.dependencies );

	// Update the package.json dependencies.
	if ( packageNames.length ) {
		tools.updateJSONFile( packageJsonPath, ( json ) => {
			// Package does not have any dependencies.
			if ( !json.dependencies && !json.devDependencies ) {
				return json;
			}

			for ( const item of packageNames ) {
				if ( json.dependencies[ item ] ) {
					json.dependencies[ item ] = `^${ options.dependencies[ item ] }`;
				} else if ( json.devDependencies[ item ] ) {
					json.devDependencies[ item ] = `^${ options.dependencies[ item ] }`;
				}
			}

			return json;
		} );
	}

	return getNewReleaseType()
		.then( ( response ) => {
			const bumpVersionCommand = `npm version ${ response.releaseType } --no-git-tag-version --force`;

			version = tools.shExec( bumpVersionCommand, shExecParams ).trim();

			const latestChanges = utils.getLatestChangesFromChangelog( version, lastTag );

			log.info( `Committing "${ utils.changelogFile }" and "package.json"...` );

			tools.shExec( `git add ./package.json ./${ utils.changelogFile }`, shExecParams );
			tools.shExec( `git commit --message="Release: ${ version }."`, shExecParams );

			log.info( 'Creating tag...' );

			tools.shExec( `git tag ${ version }`, shExecParams );
			tools.shExec( `git push origin master`, shExecParams );
			tools.shExec( `git push origin ${ version }`, shExecParams );

			log.info( 'Creating GitHub release...' );

			const packageJSON = require( packageJsonPath );

			const repositoryInfo = gitHubUrl(
				typeof packageJSON.repository === 'object' ? packageJSON.repository.url : packageJSON.repository
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
