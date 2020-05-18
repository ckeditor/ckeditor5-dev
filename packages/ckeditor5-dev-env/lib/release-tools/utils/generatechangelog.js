/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Readable } = require( 'stream' );
const { stream } = require( '@ckeditor/ckeditor5-dev-utils' );
const conventionalChangelogWriter = require( 'conventional-changelog-writer' );

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
 * @param {String} [context.highlightsPlaceholder=false]
 * @param {String} [context.collaborationFeatures=false]
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
	commitStream._read = function() {};

	for ( const commitItem of commits ) {
		commitStream.push( commitItem );
	}

	commitStream.push( null );

	return new Promise( ( resolve, reject ) => {
		commitStream
			.pipe( conventionalChangelogWriter( context, options ) )
			.pipe( stream.noop( changes => {
				resolve( changes.toString() );
			} ) )
			.on( 'error', reject );
	} );
};
