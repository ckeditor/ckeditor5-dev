/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const execOnDependencies = require( './utils/exec-on-dependencies' );

/**
 * Exports function returning development tasks.
 *
 * @param {Object} config Configuration object.
 * @param {String} config.workspaceDir Relative path to workspace where packages in development mode will be stored.
 * @returns {Object}
 */
module.exports = ( config ) => {
	const workspaceRelativePath = config.workspaceDir;
	const cwd = process.cwd();
	const path = require( 'path' );
	const packageJSON = require( path.join( cwd, 'package.json' ) );

	const tasks = {
		updateRepositories() {
			const updateTask = require( './tasks/update' );
			const installTask = require( './tasks/install' );

			const minimist = require( 'minimist' );
			const options = minimist( process.argv.slice( 2 ), {
				boolean: [ 'npm-update' ],
				default: {
					'npm-update': false
				}
			} );

			return updateTask( installTask, cwd, packageJSON, workspaceRelativePath, options[ 'npm-update' ] );
		},

		checkStatus() {
			const statusTask = require( './tasks/status' );

			return statusTask( cwd, packageJSON, workspaceRelativePath );
		},

		initRepository() {
			const initTask = require( './tasks/init' );
			const installTask = require( './tasks/install' );

			return initTask( installTask, cwd, packageJSON, workspaceRelativePath );
		},

		createPackage( done ) {
			const packageCreateTask = require( './tasks/create-package' );

			packageCreateTask( cwd, workspaceRelativePath )
				.then( done )
				.catch( ( error ) => done( error ) );
		},

		relink() {
			const relinkTask = require( './tasks/relink' );

			return relinkTask( cwd, packageJSON, workspaceRelativePath );
		},

		installPackage() {
			const installTask = require( './tasks/install' );
			const minimist = require( 'minimist' );

			const options = minimist( process.argv.slice( 2 ), {
				string: [ 'package' ],
				default: {
					plugin: ''
				}
			} );

			if ( options.package ) {
				return installTask( cwd, workspaceRelativePath, options.package );
			} else {
				throw new Error( 'Please provide a package to install: --package <path|GitHub URL|name>' );
			}
		},

		execOnRepositories() {
			const execTask = require( './tasks/exec' );
			const minimist = require( 'minimist' );
			const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
			const log = logger();

			const params = minimist( process.argv.slice( 3 ), {
				stopEarly: false,
			} );
			let task;

			try {
				if ( params.task ) {
					task = require( `./tasks/exec/functions/${ params.task }` );
				} else {
					throw new Error( 'Missing task parameter: --task task-name' );
				}
			} catch ( err ) {
				log.error( err );

				return;
			}

			return execTask( task, cwd, packageJSON, workspaceRelativePath, params );
		},

		/**
		 * Generates the release changelog based on commit messages in the repository.
		 *
		 * This method should be executed before the `tasks.createRelease` method.
		 *
		 * @params {Object} options
		 * @params {Boolean} options.debug Whether to show additional logs.
		 * @returns {Promise}
		 */
		generateChangeLog( options ) {
			const conventionalChangelog = require( 'conventional-changelog' );
			const { tools, stream, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
			const parserOpts = require( './changelog/parser-opts' );
			const writerOpts = require( './changelog/writer-opts' );
			const utils = require( './utils/changelog' );
			const log = logger( options.debug ? 'info' : 'warning' );

			console.log( `\nParsing: ${ process.cwd() }\n` );

			const shExecParams = { verbosity: options.debug ? 'info' : 'warning' };

			return utils.getNewReleaseType()
				.then( ( response ) => {
					tools.shExec( `npm version ${ response.releaseType } --no-git-tag-version`, shExecParams );

					return utils.getCurrentChangelog();
				} )
				.then( ( currentChangelog ) => {
					return new Promise( ( resolve, reject ) => {
						const parameters = {
							debug: log.info.bind( log )
						};

						// conventionalChangelog based on version in `package.json`.
						conventionalChangelog( parameters, null, null, parserOpts, writerOpts )
							.pipe( saveChangelogPipe() );

						function saveChangelogPipe() {
							return stream.noop( ( ( changes ) => {
								// Removes header from current changelog.
								currentChangelog = currentChangelog.replace( utils.changelogHeader, '' );

								// Concat header, new changelog and current changelog.
								const newChangelog = [
										utils.changelogHeader,
										changes.toString(),
										currentChangelog.trim(),
									].join( '' ).trim() + `\n`;

								utils.saveChangelog( newChangelog )
									.then( () => {
										tools.shExec( `git checkout -- ./package.json`, shExecParams );

										resolve();
									} )
									.catch( ( err ) => {
										reject( err );
									} );
							} ) );
						}
					} );
				} );
		},

		/**
		 * Creates a new release.
		 *
		 * Commits a new changelog (and package.json), creates a tag,
		 * pushes the tag to a remote server and creates a note on GitHub releases page.
		 *
		 * This method should be executed after the `tasks.generateChangeLog` method.
		 *
		 * @params {Object} options
		 * @params {String} options.token GitHub token used to authenticate.
		 * @params {Boolean} options.init Whether to create first release using this package.
		 * @params {Boolean} options.debug Whether to show additional logs.
		 * @params {Object} options.dependencies Dependencies with versions of other CKEditor5 package.
		 * @returns {Promise}
		 */
		createRelease( options ) {
			const gitHubUrl = require( 'parse-github-url' );
			const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
			const utils = require( './utils/changelog' );
			const shExecParams = { verbosity: options.debug ? 'info' : 'warning' };
			const log = logger();
			const cwd = process.cwd();

			console.log( `\nParsing: ${ cwd }\n` );

			if ( !packageJSON.repository ) {
				throw new Error( 'The "package.json" file must contain URL to the repository.' );
			}

			if ( !options.token ) {
				throw new Error( 'GitHub CLI token not found. Use --token=<token>.' );
			}

			log.info( 'Checking current branch...' );

			const currentBranch = tools.shExec( `git rev-parse --abbrev-ref HEAD`, shExecParams ).trim();

			if ( currentBranch !== 'master' ) {
				throw new Error( 'Release can be create only from the main branch.' );
			}

			log.info( 'Checking whether to master is up to date...' );

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
				const tagList = tools.shExec( `git tag --list`, shExecParams ).trim();

				if ( tagList ) {
					lastTag = tools.shExec( 'git describe --tags `git rev-list --tags --max-count=1`', shExecParams ).trim();
				}
			}

			const packageNames = Object.keys( options.dependencies );
			const packageJsonPath = path.join( cwd, 'package.json' );

			if ( packageNames.length ) {
				tools.updateJSONFile( packageJsonPath, ( json ) => {
					if ( !json.dependencies ) {
						return json;
					}

					for ( const item of packageNames ) {
						if ( !json.dependencies[ item ] ) {
							continue;
						}

						json.dependencies[ item ] = `^${ options.dependencies[ item ] }`;
					}

					json.dependencies = tools.sortObject( json.dependencies );

					return json;
				} );
			}

			return utils.getNewReleaseType()
				.then( ( response ) => {
					const bumpVersionCommand = `npm version ${ response.releaseType } --no-git-tag-version --force`;
					version = tools.shExec( bumpVersionCommand, { verbosity: 'error' } ).trim();

					return utils.getLatestChangesFromChangelog( version, lastTag );
				} )
				.then( ( latestChanges ) => {
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

					return utils.createGithubRelease( options.token, {
						repositoryOwner: repositoryInfo.owner,
						repositoryName: repositoryInfo.name,
						version: version,
						description: latestChanges,
						debug: options.debug
					} );
				} )
				.then( () => {
					log.info( `Release "${ version }" has been created and published.` );
				} );
		},

		/**
		 * Generates the changelog for dependencies.
		 *
		 * @param {Object} options
		 * @params {String} options.cwd Current work directory.
		 * @params {String} options.workspace A relative path to the workspace.
		 * @params {Boolean} options.debug Whether to show additional logs.
		 * @returns {Promise}
		 */
		generateChangelogForDependencies( options ) {
			const execOptions = {
				cwd: options.cwd,
				workspace: options.workspace
			};

			const functionToExecute = ( repositoryName, repositoryPath ) => {
				process.chdir( repositoryPath );

				return tasks.generateChangeLog( {
					debug: options.debug
				} );
			};

			return execOnDependencies( execOptions, functionToExecute );
		},

		/**
		 * Generates the changelog for dependencies.
		 *
		 * @param {Object} options
		 * @params {String} options.cwd Current work directory.
		 * @params {String} options.workspace A relative path to the workspace.
		 * @params {String} options.token GitHub token used to authenticate.
		 * @params {Boolean} options.init Whether to create first release using this package.
		 * @params {Boolean} options.debug Whether to show additional logs.
		 * @params {Object} options.dependencies Dependencies with versions of other CKEditor5 package.
		 * @returns {Promise}
		 */
		releaseDependencies( options ) {
			const execOptions = {
				cwd: options.cwd,
				workspace: options.workspace
			};

			const functionToExecute = ( repositoryName, repositoryPath ) => {
				process.chdir( repositoryPath );

				return tasks.createRelease( {
					init: options.init,
					token: options.token,
					debug: options.debug,
					dependencies: options.dependencies
				} );
			};

			return execOnDependencies( execOptions, functionToExecute );
		}
	};

	return tasks;
};
