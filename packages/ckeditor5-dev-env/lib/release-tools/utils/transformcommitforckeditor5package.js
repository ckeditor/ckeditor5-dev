/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const parserOptions = require( './parser-options' );
const utils = require( './transform-commit-utils' );

/**
 * Parses a single commit:
 *   - displays a log when the commit has invalid format of the message,
 *   - filters out the commit if it should not be visible in the changelog,
 *   - makes links to issues and user's profiles on GitHub.
 *
 * @param {Commit} commit
 * @param {Boolean} [displayLog=true] Whether to display the logs.
 * @returns {Commit}
 */
module.exports = function transformCommitForCKEditor5Package( commit, displayLog = true ) {
	const log = logger( displayLog ? 'info' : 'error' );

	// For merge commit from Github, additional description is provided as "footer".
	if ( !commit.body && commit.footer ) {
		commit.body = commit.footer;
		commit.footer = null;
	}

	if ( commit.header.startsWith( 'Merge' ) ) {
		const parsedHeader = parserOptions.headerPattern.exec( commit.body );

		if ( parsedHeader ) {
			parserOptions.headerCorrespondence.forEach( ( key, index ) => {
				commit[ key ] = parsedHeader[ index + 1 ];
			} );

			// Remove the new header from commit body in order to avoid
			// duplicating the same sentence in a changelog description.
			commit.body = commit.body.replace( parserOptions.headerPattern, '' ).trim();
		}
	}

	if ( typeof commit.hash === 'string' ) {
		commit.hash = commit.hash.substring( 0, 7 );
	}

	const hasCorrectType = utils.availableCommitTypes.has( commit.type );
	const isCommitIncluded = utils.availableCommitTypes.get( commit.type );

	let logMessage = `* ${ commit.hash } "${ commit.header }" `;

	if ( hasCorrectType && isCommitIncluded ) {
		logMessage += chalk.green( 'INCLUDED' );
	} else if ( hasCorrectType && !isCommitIncluded ) {
		logMessage += chalk.grey( 'SKIPPED' );
	} else {
		logMessage += chalk.red( 'INVALID' );
	}

	if ( commit.header.startsWith( 'Merge' ) && hasCorrectType ) {
		const indentSize = '[XX:YY:ZZ] * 1234567 '.length;
		logMessage += `\n${ ' '.repeat( indentSize ) }"${ commit.type }: ${ commit.subject }"`;
	}

	log.info( logMessage );

	if ( !isCommitIncluded ) {
		return;
	}

	const issues = [];

	commit.rawType = commit.type;
	commit.type = utils.getCommitType( commit.type );

	if ( typeof commit.subject === 'string' ) {
		commit.subject = utils.linkGithubIssues(
			utils.linkGithubUsers( commit.subject ), issues
		);
	}

	if ( typeof commit.body === 'string' ) {
		commit.body = commit.body.split( '\n' )
			.map( ( line ) => {
				if ( !line.length ) {
					return '';
				}

				return '  ' + line;
			} )
			.join( '\n' );
	}

	for ( const note of commit.notes ) {
		if ( note.title === 'BREAKING CHANGE' ) {
			note.title = 'BREAKING CHANGES';
		}
		note.text = utils.linkGithubIssues( utils.linkGithubUsers( note.text ) );
	}

	// Removes references that already appear in the subject.
	commit.references = commit.references.filter( ( reference ) => !issues.includes( reference.issue ) );

	return commit;
};

/**
 * @typedef {Object} Commit
 *
 * @property {String} [type] Type of the commit.
 *
 * @property {String} [subject] Subject of the commit.
 *
 * @property {String} [header] First line of the commit message.
 *
 * @property {String|null} [body] Body of the commit message.
 *
 * @property {String|null} [footer] Footer of the commit message.
 *
 * @property {Array.<CommitNote>} [notes] Notes for the commit.
 *
 * @property {Array.<Number|String>} [references] An array with issue ids.
 *
 * @property {Array.<String>} [mentions] An array with users profiles extracted
 * from the commit message.
 *
 * @property {String} [hash] The commit SHA-1 id.
 *
 */
/**
 * @typedef {Object} CommitNote
 *
 * @property {String} [title] Type of the note.
 *
 * @property {String} [text] Text of the note.
 */
