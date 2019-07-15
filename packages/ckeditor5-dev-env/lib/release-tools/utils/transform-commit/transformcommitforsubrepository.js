/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const utils = require( './transform-commit-utils' );

/**
 * Parses a single commit:
 *   - displays a log when the commit has invalid format of the message,
 *   - filters out the commit if it should not be visible in the changelog,
 *   - makes links to issues and organizations on GitHub.
 *
 * Returns `undefined` if given commit should not be added to the changelog. This behavior can be changed
 * using the `context.returnInvalidCommit` option.
 *
 * @param {Commit} rawCommit
 * @param {Object} [context={}]
 * @param {Boolean} [context.returnInvalidCommit=false] Whether invalid commit should be returned.
 * @returns {Commit|undefined}
 */
module.exports = function transformCommitForSubRepository( rawCommit, context = {} ) {
	// Let's clone the commit. We don't want to modify the reference.
	const commit = Object.assign( {}, rawCommit, {
		// Copy the original `type` of the commit.
		rawType: rawCommit.type,
		notes: rawCommit.notes.map( note => Object.assign( {}, note ) )
	} );

	// Whether the commit will be printed in the changelog.
	const isCommitIncluded = utils.availableCommitTypes.get( commit.rawType );

	// Our merge commit always contains two lines:
	// Merge ...
	// Prefix: Subject of the changes.
	// Unfortunately, merge commit made by Git does not contain the second line.
	// Because of that hash of the commit is parsed as a body and the changelog will crash.
	// See: https://github.com/ckeditor/ckeditor5-dev/issues/276.
	if ( commit.merge && !commit.hash ) {
		commit.hash = commit.body;
		commit.header = commit.merge;
		commit.body = null;
	}

	// Ignore the `stable` merge branch.
	if ( commit.merge === 'Merge branch \'stable\'' ) {
		return;
	}

	if ( typeof commit.hash === 'string' ) {
		commit.hash = commit.hash.substring( 0, 7 );
	}

	// It's used only for displaying the commit. Changelog generator will filter out the invalid entries.
	if ( !isCommitIncluded ) {
		return context.returnInvalidCommit ? commit : undefined;
	}

	// Remove [skip ci] from the commit subject.
	commit.subject = commit.subject.replace( /\[skip ci\]/, '' ).trim();

	// If a dot is missing at the end of the subject...
	if ( !commit.subject.endsWith( '.' ) ) {
		// ...let's add it.
		commit.subject += '.';
	}

	// The `type` below will be key for grouping commits.
	commit.type = utils.getCommitType( commit.rawType );

	if ( typeof commit.subject === 'string' ) {
		commit.subject = makeLinks( commit.subject );
	}

	// Remove additional notes from the commit's footer.
	// Additional notes are added to the footer. In order to avoid duplication, they should be removed.
	if ( commit.footer && commit.notes.length ) {
		commit.footer = commit.footer.split( '\n' )
			.filter( footerLine => {
				// For each footer line checks whether the line starts with note prefix ("NOTE": ...).
				// If so, this footer line should be removed.
				return !commit.notes.some( note => footerLine.startsWith( note.title ) );
			} )
			.join( '\n' )
			.trim();
	}

	// If `body` of the commit is empty but the `footer` isn't, let's swap those.
	if ( commit.footer && !commit.body ) {
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
	comment = utils.linkToGithubIssue( comment );
	comment = utils.linkToGithubUser( comment );

	return comment;
}

/**
 * @typedef {Object} Commit
 *
 * @property {String} rawType Type of the commit without any modifications.
 *
 * @property {String} type Type of the commit (it can be modified).
 *
 * @property {String} hash The commit SHA-1 id.
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
 */

/**
 * @typedef {Object} CommitNote
 *
 * @property {String} title Type of the note.
 *
 * @property {String} text Text of the note.
 */
