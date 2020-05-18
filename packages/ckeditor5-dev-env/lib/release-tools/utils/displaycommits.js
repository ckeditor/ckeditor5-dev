/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const utils = require( './transformcommitutils' );
const { INDENT_SIZE, COMMIT_INDENT_SIZE } = require( './cli' );

/**
 * @param {Array.<Commit>|Set.<Commit>} commits
 * @param {Object} [options={}]
 * @param {Boolean} [options.attachLinkToCommit=false] Whether to attach a link to parsed commit.
 * @param {Number} [options.indentLevel=1] The indent level.
 */
module.exports = function displayCommits( commits, options = {} ) {
	const log = logger();

	const attachLinkToCommit = options.attachLinkToCommit || false;
	const indentLevel = options.indentLevel || 1;

	const listIndent = ' '.repeat( INDENT_SIZE * indentLevel );
	const listEntriesIndent = ' '.repeat( INDENT_SIZE * indentLevel + COMMIT_INDENT_SIZE );

	if ( !( commits.length || commits.size ) ) {
		log.info( listIndent + chalk.italic( 'No commits to display.' ) );
	}

	for ( const singleCommit of commits ) {
		const hasCorrectType = utils.availableCommitTypes.has( singleCommit.rawType );
		const isCommitIncluded = utils.availableCommitTypes.get( singleCommit.rawType );
		const hash = singleCommit.hash.substring( 0, 7 );

		let logMessage = `${ listIndent }* ${ chalk.yellow( hash ) } "${ utils.truncate( singleCommit.header, 100 ) }" `;

		if ( hasCorrectType && isCommitIncluded ) {
			logMessage += chalk.green( 'INCLUDED' );
		} else if ( hasCorrectType && !isCommitIncluded ) {
			logMessage += chalk.grey( 'SKIPPED' );
		} else {
			logMessage += chalk.red( 'INVALID' );
		}

		// Avoid displaying singleCommit merge twice.
		if ( singleCommit.merge && singleCommit.merge !== singleCommit.header ) {
			logMessage += `\n${ listEntriesIndent }${ chalk.italic( singleCommit.merge ) }`;
		}

		for ( const note of singleCommit.notes ) {
			const limit = 100 - note.title.length;

			logMessage += `\n${ listEntriesIndent }${ note.title }: ${ utils.truncate( note.text, limit ) } `;
		}

		if ( attachLinkToCommit ) {
			const url = `${ singleCommit.repositoryUrl }/commit/${ singleCommit.hash }`;

			logMessage += `\n${ listEntriesIndent }${ chalk.gray( url ) }`;
		}

		log.info( logMessage );
	}
};
