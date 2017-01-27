/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const conventionalChangelog = require( 'conventional-changelog' );
const { tools, stream, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const parserOpts = require( '../changelog/parser-options' );
const writerOpts = require( '../changelog/writer-options' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const utils = require( '../utils/changelog' );

/**
 * Generates the release changelog based on commit messages in the repository.
 *
 * This method should be executed before the `tasks.createRelease` method.
 *
 * @returns {Promise}
 */
module.exports = function generateChangelog() {
	const log = logger();

	log.info( `Generating changelog for: ${ process.cwd() }` );

	const shExecParams = { verbosity: 'warning' };

	return getNewReleaseType().then( ( response ) => {
		// Bump the version for conventionalChangelog.
		tools.shExec( `npm version ${ response.releaseType } --no-git-tag-version`, shExecParams );

		return new Promise( ( resolve ) => {
			// conventionalChangelog based on version in `package.json`.
			conventionalChangelog( {}, null, null, parserOpts, writerOpts )
				.pipe( saveChangelogPipe() );

			function saveChangelogPipe() {
				return stream.noop( ( changes ) => {
					let currentChangelog = utils.getCurrentChangelog();

					// Remove header from current changelog.
					currentChangelog = currentChangelog.replace( utils.changelogHeader, '' );

					// Concat header, new and current changelog.
					let newChangelog = utils.changelogHeader + changes.toString() + currentChangelog.trim();

					// Remove all white characters and add empty line at the end.
					newChangelog = newChangelog.trim() + '\n';

					utils.saveChangelog( newChangelog );

					// Revert bumping the version.
					tools.shExec( `git checkout -- ./package.json`, shExecParams );

					resolve();
				} );
			}
		} );
	} );
};
