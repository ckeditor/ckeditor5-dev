/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const utils = require( './transform-commit-utils' );

// A size of indent for a log. The number is equal to length of the Gulp log string:
// '[XX:YY:ZZ] * 1234567 ', where '1234567' is a short commit id.
const INDENT_SIZE = 21;

/**
 * Parses a single commit:
 *   - displays a log when the commit has invalid format of the message,
 *   - filters out the commit if it should not be visible in the changelog,
 *   - makes links to issues and organizations on GitHub.
 *
 * @param {Commit} commit
 * @param {Object} context
 * @param {Boolean} context.displayLogs Whether to display the logs.
 * @param {Object} context.packageData Content from the 'package.json' for given package.
 * @returns {Commit}
 */
module.exports = function transformCommitForSubRepository( commit, context ) {
	const log = logger( context.displayLogs ? 'info' : 'error' );

	if ( typeof commit.hash === 'string' ) {
		commit.hash = commit.hash.substring( 0, 7 );
	}

	const hasCorrectType = utils.availableCommitTypes.has( commit.type );
	const isCommitIncluded = utils.availableCommitTypes.get( commit.type );

	let logMessage = `* ${ chalk.yellow( commit.hash ) } "${ utils.truncate( commit.header, 100 ) }" `;

	if ( hasCorrectType && isCommitIncluded ) {
		logMessage += chalk.green( 'INCLUDED' );
	} else if ( hasCorrectType && !isCommitIncluded ) {
		logMessage += chalk.grey( 'SKIPPED' );
	} else {
		logMessage += chalk.red( 'INVALID' );
	}

	if ( commit.merge ) {
		logMessage += `\n${ ' '.repeat( INDENT_SIZE ) }${ commit.merge }`;
	}

	log.info( logMessage );

	if ( !isCommitIncluded ) {
		return;
	}

	commit.rawType = commit.type;
	commit.type = utils.getCommitType( commit.type );

	if ( typeof commit.subject === 'string' ) {
		commit.subject = makeLinks( commit.subject );
	}

	if ( commit.footer && !commit.body && !commit.notes.length ) {
		commit.body = commit.footer;
		commit.footer = null;
	}

	if ( typeof commit.body === 'string' ) {
		commit.body = commit.body.split( '\n' )
			.map( line => {
				if ( !line.length ) {
					return '';
				}

				return '  ' + line;
			} )
			.join( '\n' );

		commit.body = makeLinks( commit.body );
	}

	for ( const note of commit.notes ) {
		if ( note.title === 'BREAKING CHANGE' ) {
			note.title = 'BREAKING CHANGES';
		}

		note.text = makeLinks( note.text );
	}

	// Clear the references array - we don't want to hoist the issues.
	delete commit.references;

	return commit;
};

function makeLinks( comment ) {
	comment = utils.linkToGithubRepositories( comment );
	comment = utils.linkToNpmScopedPackage( comment );
	comment = utils.linkToGithubIssues( comment );
	comment = utils.linkToGithubUsers( comment );

	return comment;
}

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
