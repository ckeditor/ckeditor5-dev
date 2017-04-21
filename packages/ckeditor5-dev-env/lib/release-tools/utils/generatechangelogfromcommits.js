/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const conventionalChangelog = require( 'conventional-changelog' );
const { stream, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const getWriterOptions = require( './getwriteroptions' );
const changelogUtils = require( './changelog' );
const parserOptions = require( './parser-options' );

/**
 * Generates a changelog based on user's commits in the repository and saves
 * it in the changelog file.
 *
 * @param {Object} options
 * @param {String} options.version A version for generated changelog.
 * @param {Function} options.transformCommit A function which transforms the commit.
 * @param {String|null} options.tagName Name of the last created tag for the repository.
 * @returns {Promise}
 */
module.exports = function generateChangelogFromCommits( options ) {
	const log = logger();

	return new Promise( ( resolve ) => {
		if ( !fs.existsSync( changelogUtils.changelogFile ) ) {
			log.warning( 'Changelog file does not exist. Creating...' );

			changelogUtils.saveChangelog( changelogUtils.changelogHeader );
		}

		const context = {
			version: options.version,
			displayLogs: false
		};

		const gitRawCommitsOpts = {
			from: options.tagName,
			merges: undefined,
			firstParent: true
		};

		const writerOptions = getWriterOptions( options.transformCommit );

		conventionalChangelog( {}, context, gitRawCommitsOpts, parserOptions, writerOptions )
			.pipe( saveChangelogPipe( options.version, resolve ) );
	} );
};

function saveChangelogPipe( version, done ) {
	return stream.noop( ( changes ) => {
		let currentChangelog = changelogUtils.getChangelog();

		// Remove header from current changelog.
		currentChangelog = currentChangelog.replace( changelogUtils.changelogHeader, '' );

		// Concat header, new and current changelog.
		let newChangelog = changelogUtils.changelogHeader + changes.toString() + currentChangelog.trim();
		newChangelog = newChangelog.trim() + '\n';

		// Save the changelog.
		changelogUtils.saveChangelog( newChangelog );

		done( version );
	} );
}
