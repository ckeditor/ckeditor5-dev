/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const conventionalChangelog = require( 'conventional-changelog' );
const changelogUtils = require( './changelog' );
const getWriterOptions = require( './transform-commit/getwriteroptions' );
const parserOptions = require( './transform-commit/parser-options' );
const { stream, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const { additionalCommitNotes } = require( './transform-commit/transform-commit-utils' );
const cli = require( './cli' );

const UPDATED_TRANSLATION_COMMIT = '* Updated translations.';

/**
 * Generates a changelog based on user's commits in the repository and saves
 * it in the changelog file.
 *
 * @param {Object} options
 * @param {String} options.version A version for generated changelog.
 * @param {Function} options.transformCommit A function which transforms commits.
 * @param {String|null} options.tagName Name of the last created tag for the repository.
 * @param {String} options.newTagName Name of the tag for current version.
 * @param {Boolean} [options.isInternalRelease=false] Whether the changelog is generated for internal release.
 * @param {Boolean} [options.doNotSave=false] If set on `true`, changes will be resolved in returned promise
 * instead of saved in CHANGELOG file.
 * @param {Boolean} [options.additionalNotes=false] If set on `true, each category will contain additional description.
 * See: `/packages/ckeditor5-dev-env/lib/release-tools/utils/transform-commit/transform-commit-utils.js#additionalCommitNotes`
 * @param {Boolean} [options.skipLinks=false] If set on true, links to release or commits will be omitted.
 * @param {Number} [options.indentLevel=0] The indent level. This function could be used inside another (bigger) script. If we would like to
 * display indents logs, we need to increase/decrease indent level manually.
 * @returns {Promise}
 */
module.exports = function generateChangelogFromCommits( options ) {
	const log = logger();
	const indentLevel = options.indentLevel || 0;
	const indent = ' '.repeat( indentLevel * cli.INDENT_SIZE );

	return new Promise( resolve => {
		if ( !options.doNotSave && !fs.existsSync( changelogUtils.changelogFile ) ) {
			log.warning( indent + 'Changelog file does not exist. Creating...' );

			changelogUtils.saveChangelog( changelogUtils.changelogHeader );
		}

		const context = {
			version: options.version,
			currentTag: options.newTagName,
			previousTag: options.tagName,
			isInternalRelease: Boolean( options.isInternalRelease ),
			additionalNotes: {},
			skipCommitsLink: Boolean( options.skipLinks ),
			skipCompareLink: Boolean( options.skipLinks )
		};

		if ( options.additionalNotes ) {
			context.additionalNotes = additionalCommitNotes;
		}

		const gitRawCommitsOpts = {
			from: options.tagName,
			merges: undefined,
			firstParent: true
		};

		const writerOptions = getWriterOptions( options.transformCommit );

		/* istanbul ignore next */
		if ( process.env.DEBUG ) {
			// Displays the final `context` which will be used to generate the changelog.
			// It contains grouped commits, repository details, etc.
			writerOptions.debug = getDebugFuntion();
		}

		const changelogStream = conventionalChangelog( {}, context, gitRawCommitsOpts, parserOptions, writerOptions );

		changelogStream
			.pipe( changelogPipe( {
				done: resolve,
				doNotSave: options.doNotSave,
				version: options.version,
				stream: changelogStream
			} ) );
	} );
};

function changelogPipe( options ) {
	return stream.noop( function( changes ) {
		if ( options.stream.destroyed ) {
			return;
		}

		const newEntries = groupUpdatedTranslationsCommits( changes.toString() );

		if ( options.doNotSave ) {
			return options.done( newEntries );
		}

		let currentChangelog = changelogUtils.getChangelog();

		// Remove header from current changelog.
		currentChangelog = currentChangelog.replace( changelogUtils.changelogHeader, '' );

		// Concat header, new and current changelog.
		let newChangelog = changelogUtils.changelogHeader + newEntries + currentChangelog.trim();
		newChangelog = newChangelog.trim() + '\n';

		// Save the changelog.
		changelogUtils.saveChangelog( newChangelog );

		// When the CHANGELOG.md is being created for the first time by the script, `conventionalChangelog()` receives
		// data in the stream twice. It causes generating the changelog twice. The first one for the specified package (cwd),
		// the second one is being generated for the next cwd in a queue (or the cwd where the entire script was called).
		// We need to destroy the stream manually in order to avoid calling it more than once.
		options.stream.destroy();
		options.done( options.version );
	} );
}

function getDebugFuntion() {
	/* istanbul ignore next */
	return ( ...params ) => {
		console.log( ...params );
	};
}

function groupUpdatedTranslationsCommits( changelog ) {
	let foundUpdatedTranslationCommit = false;

	const changelogAsArray = changelog.split( '\n' );

	// An array that contains duplicated commits.
	const removedEntries = [];

	// An array that contains changelog without duplicated entries.
	const uniqueEntries = changelogAsArray.filter( line => {
		if ( !line.startsWith( UPDATED_TRANSLATION_COMMIT ) ) {
			return true;
		}

		if ( foundUpdatedTranslationCommit ) {
			removedEntries.push( line );

			return false;
		}

		foundUpdatedTranslationCommit = true;

		return true;
	} );

	return uniqueEntries.map( line => {
		if ( !line.startsWith( UPDATED_TRANSLATION_COMMIT ) ) {
			return line;
		}

		return line + ' ' + removedEntries.map( entry => {
			return entry.match( /(\(\[.{7}\]\([^)]+\)\))/ )[ 1 ];
		} ).join( ' ' );
	} ).join( '\n' );
}
