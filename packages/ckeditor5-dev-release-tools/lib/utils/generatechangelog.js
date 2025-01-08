/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Readable } from 'stream';
import { stream } from '@ckeditor/ckeditor5-dev-utils';
import { writeChangelogStream } from 'conventional-changelog-writer';

const UPDATED_TRANSLATION_COMMIT = '* Updated translations.';

/**
 * Generates the changelog based on commits.
 *
 * @param {Array.<Commit>} commits
 *
 * @param {object} context
 * @param {string} context.version Current version for the release.
 * @param {string} context.repoUrl The repository URL.
 * @param {string} context.currentTag A tag for the current version.
 * @param {string} context.commit Commit keyword in the URL.
 * @param {string} [context.previousTag] A tag for the previous version.
 * @param {boolean} [context.skipCommitsLink=false] Whether to skip adding links to commit.
 * @param {boolean} [context.skipCompareLink=false] Whether to remove the compare URL in the header.
 *
 * @param {object} options
 * @param {object} options.transform
 * @param {function} options.transform.hash A function for mapping the commit's hash.
 * @param {Array.<string>|string} options.groupBy A key for grouping the commits.
 * @param {function} options.commitGroupsSort A sort function for the groups.
 * @param {function} options.noteGroupsSort A soft function for the notes.
 * @param {string} options.mainTemplate The main template for the changelog.
 * @param {string} options.headerPartial The "header" partial used in the main template.
 * @param {string} options.commitPartial The "commit" partial used in the main template.
 * @param {string} options.footerPartial The "footer" partial used in the main template.
 *
 * @returns {Promise.<string>}
 */
export default function generateChangelog( commits, context, options ) {
	const commitStream = new Readable( { objectMode: true } );
	/* istanbul ignore next */
	commitStream._read = function() {};

	for ( const commitItem of commits ) {
		commitStream.push( commitItem );
	}

	commitStream.push( null );

	return new Promise( ( resolve, reject ) => {
		commitStream
			.pipe( writeChangelogStream( context, options ) )
			.pipe( stream.noop( changes => {
				changes = mergeUpdateTranslationsCommits( changes.toString(), {
					skipCommitsLink: context.skipCommitsLink
				} );

				resolve( changes );
			} ) )
			.on( 'error', reject );
	} );
}

/**
 * Merges multiple "Updated translations." entries into the single commit.
 *
 * @param {string} changelog Generated changelog.
 * @param {object} [options={}]
 * @param {boolean} [options.skipCommitsLink=false] Whether to skip adding links to commit.
 * @returns {string}
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
