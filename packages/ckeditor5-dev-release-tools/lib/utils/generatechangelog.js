/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Readable } = require( 'stream' );
const { stream } = require( '@ckeditor/ckeditor5-dev-utils' );
const conventionalChangelogWriter = require( 'conventional-changelog-writer' );

const UPDATED_TRANSLATION_COMMIT = '* Updated translations.';

/**
 * Generates the changelog based on commits.
 *
 * @param {Array.<Commit>} commits
 *
 * @param {Object} context
 * @param {String} context.version Current version for the release.
 * @param {String} context.repoUrl The repository URL.
 * @param {String} context.currentTag A tag for the current version.
 * @param {String} context.commit Commit keyword in the URL.
 * @param {String} [context.previousTag] A tag for the previous version.
 * @param {Boolean} [options.highlightsPlaceholder=false] Whether to add a note about release highlights.
 * @param {Boolean} [options.collaborationFeatures=false] Whether to add a note about collaboration features.
 * @param {Boolean} [context.skipCommitsLink=false] Whether to skip adding links to commit.
 * @param {Boolean} [context.skipCompareLink=false] Whether to remove the compare URL in the header.
 *
 * @param {Object} options
 * @param {Object} options.transform
 * @param {Function} options.transform.hash A function for mapping the commit's hash.
 * @param {Array.<String>|String} options.groupBy A key for grouping the commits.
 * @param {Function} options.commitGroupsSort A sort function for the groups.
 * @param {Function} options.noteGroupsSort A soft function for the notes.
 * @param {String} options.mainTemplate The main template for the changelog.
 * @param {String} options.headerPartial The "header" partial used in the main template.
 * @param {String} options.commitPartial The "commit" partial used in the main template.
 * @param {String} options.footerPartial The "footer" partial used in the main template.
 *
 * @returns {Promise.<String>}
 */
module.exports = function generateChangelog( commits, context, options ) {
	const commitStream = new Readable( { objectMode: true } );
	/* istanbul ignore next */
	commitStream._read = function() {};

	for ( const commitItem of commits ) {
		commitStream.push( commitItem );
	}

	commitStream.push( null );

	return new Promise( ( resolve, reject ) => {
		commitStream
			.pipe( conventionalChangelogWriter( context, options ) )
			.pipe( stream.noop( changes => {
				changes = mergeUpdateTranslationsCommits( changes.toString(), {
					skipCommitsLink: context.skipCommitsLink
				} );

				resolve( changes );
			} ) )
			.on( 'error', reject );
	} );
};

/**
 * Merges multiple "Updated translations." entries into the single commit.
 *
 * @param {String} changelog Generated changelog.
 * @param {Object} [options={}]
 * @param {Boolean} [options.skipCommitsLink=false] Whether to skip adding links to commit.
 * @returns {String}
 */
function mergeUpdateTranslationsCommits( changelog, options = {} ) {
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

	if ( options.skipCommitsLink ) {
		return uniqueEntries.join( '\n' );
	}

	return uniqueEntries.map( line => {
		if ( !line.startsWith( UPDATED_TRANSLATION_COMMIT ) ) {
			return line;
		}

		const newLine = line + ' ' + removedEntries
			.map( entry => {
				const match = entry.match( /(\(\[commit\].*)$/ );

				return match ? match[ 1 ] : null;
			} )
			.filter( item => !!item )
			.join( ' ' );

		return newLine.trim().replace( /\) \(/g, ', ' );
	} ).join( '\n' );
}
