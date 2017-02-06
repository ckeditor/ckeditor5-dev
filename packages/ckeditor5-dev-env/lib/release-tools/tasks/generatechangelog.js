/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const conventionalChangelog = require( 'conventional-changelog' );
const { tools, stream, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const parserOpts = require( '../changelog/parser-options' );
const writerOpts = require( '../changelog/writer-options' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const hasCommitsUntilLastRelease = require( '../utils/hascommitsuntillastrelease' );
const utils = require( '../utils/changelog' );
const cli = require( '../utils/cli' );

const BREAK_CHANGELOG_MESSAGE = 'Generate the changelog has been aborted.';

/**
 * Generates the release changelog based on commit messages in the repository.
 *
 * User can provide a version for the entry in changelog.
 *
 * If package does not have any commits, user has to confirm whether the changelog
 * should be generated.
 *
 * @returns {Promise}
 */
module.exports = function generateChangelog() {
	const log = logger();
	const cwd = process.cwd();
	const packageJson = require( path.join( cwd, 'package.json' ) );

	log.info( `Generating changelog for "${ packageJson.name }".` );

	return new Promise( ( resolve, reject ) => {
		let promise = Promise.resolve();

		if ( !hasCommitsUntilLastRelease() ) {
			promise = cli.confirmRelease()
				.then( ( isConfirmed ) => {
					if ( !isConfirmed ) {
						throw new Error( BREAK_CHANGELOG_MESSAGE );
					}
				} );
		}

		promise.then( () => getNewReleaseType() )
			.then( ( response ) => cli.provideVersion( packageJson.name, packageJson.version, response.releaseType ) )
			.then( ( version ) => {
				const gitRawCommitsOpts = {
					merges: undefined,
					firstParent: true
				};
				const context = {
					version
				};

				conventionalChangelog( {}, context, gitRawCommitsOpts, parserOpts, writerOpts )
					.pipe( saveChangelogPipe() );
			} )
			.catch( ( err ) => {
				// User does not want to generate changelog. Abort the process.
				if ( err.message === BREAK_CHANGELOG_MESSAGE ) {
					return resolve();
				}

				reject( err );
			} );

		function saveChangelogPipe() {
			return stream.noop( ( changes ) => {
				let currentChangelog = utils.getChangelog();

				// Remove header from current changelog.
				currentChangelog = currentChangelog.replace( utils.changelogHeader, '' );

				// Concat header, new and current changelog.
				let newChangelog = utils.changelogHeader + changes.toString() + currentChangelog.trim();
				newChangelog = newChangelog.trim() + '\n';

				// Save the changelog.
				utils.saveChangelog( newChangelog );

				// Commit the changelog.
				tools.shExec( `git add ${ utils.changelogFile }` );
				tools.shExec( `git commit -m "Docs: Changelog."` );

				log.info( `Changelog for "${ packageJson.name }" has been generated.` );

				resolve();
			} );
		}
	} );
};
