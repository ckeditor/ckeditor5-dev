/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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

	if ( !( commits.length || commits.size ) ) {
		log.info( listIndent + chalk.italic( 'No commits to display.' ) );
	}

	const COMMITS_SEPARATOR = listIndent + chalk.gray( '-'.repeat( 112 ) );

	// Group of commits by the commit's hash.
	/** @type {Map.<String, Set.<Commit>>} */
	const commitGroups = new Map();

	for ( const singleCommit of commits ) {
		getCommitGroup( singleCommit ).add( singleCommit );
	}

	// A flag that helps avoid duplication separators if two groups are consecutive one after another.
	let finishedWithSeparator = false;

	for ( const [ hash, commits ] of commitGroups ) {
		// Do not duplicate the separator if it was already added.
		if ( commits.size > 1 && !finishedWithSeparator ) {
			log.info( COMMITS_SEPARATOR );
		}

		for ( const singleCommit of commits.values() ) {
			const hasCorrectType = utils.availableCommitTypes.has( singleCommit.rawType );
			const isCommitIncluded = utils.availableCommitTypes.get( singleCommit.rawType );

			const indent = commits.size > 1 ? listIndent.slice( 0, listIndent.length - 1 ) + chalk.gray( '|' ) : listIndent;
			const noteIndent = indent + ' '.repeat( COMMIT_INDENT_SIZE );

			let logMessage = `${ indent }* ${ chalk.yellow( hash.slice( 0, 7 ) ) } "${ utils.truncate( singleCommit.header, 100 ) }" `;

			if ( hasCorrectType && isCommitIncluded ) {
				logMessage += chalk.green( 'INCLUDED' );
			} else if ( hasCorrectType && !isCommitIncluded ) {
				logMessage += chalk.grey( 'SKIPPED' );
			} else {
				logMessage += chalk.red( 'INVALID' );
			}

			// Avoid displaying singleCommit merge twice.
			if ( singleCommit.merge && singleCommit.merge !== singleCommit.header ) {
				logMessage += `\n${ noteIndent }${ chalk.italic( singleCommit.merge ) }`;
			}

			for ( const note of singleCommit.notes ) {
				const limit = 100 - note.title.length;

				logMessage += `\n${ noteIndent }${ note.title }: ${ utils.truncate( note.text, limit ) } `;
			}

			if ( attachLinkToCommit ) {
				const url = `${ singleCommit.repositoryUrl }/commit/${ singleCommit.hash }`;

				logMessage += `\n${ noteIndent }${ chalk.gray( url ) }`;
			}

			log.info( logMessage );
		}

		if ( commits.size > 1 ) {
			finishedWithSeparator = true;
			log.info( COMMITS_SEPARATOR );
		} else {
			finishedWithSeparator = false;
		}
	}

	/**
	 * @param {Commit} commit
	 * @returns {Set.<Commit>}
	 */
	function getCommitGroup( commit ) {
		if ( !commitGroups.has( commit.hash ) ) {
			commitGroups.set( commit.hash, new Set() );
		}

		return commitGroups.get( commit.hash );
	}
};
