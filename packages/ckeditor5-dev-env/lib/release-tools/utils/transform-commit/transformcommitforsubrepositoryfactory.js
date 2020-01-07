/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const utils = require( './transform-commit-utils' );

/**
 * Factory function.
 *
 * It returns a function that parses a single commit:
 *   - filters out the commit if it should not be visible in the changelog,
 *   - makes links to issues and organizations on GitHub,
 *   - normalizes notes (e.g. "MAJOR BREAKING CHANGE" will be replaced with "MAJOR BREAKING CHANGES").
 *
 * Returns `undefined` if the parsed commit should not be visible to the changelog. This behavior can be changed
 * using the `options.returnInvalidCommit` option.
 *
 * @param {Object} [options={}]
 * @param {Boolean} [options.treatMajorAsMinorBreakingChange=false] If set on true, all "MAJOR BREAKING CHANGES" notes will be replaced
 * with "MINOR BREAKING CHANGES". This behaviour is being disabled automatically if `options.useExplicitBreakingChangeGroups` is
 * set on `false` because all commits will be treated as "BREAKING CHANGES".
 * @param {Boolean} [options.returnInvalidCommit=false] Whether an invalid commit should be returned.
 * @param {Boolean} [options.useExplicitBreakingChangeGroups] If set on `true`, notes from parsed commits will be grouped as
 * "MINOR BREAKING CHANGES" and "MAJOR BREAKING CHANGES'. If set on `false` (by default), all breaking changes notes will be treated
 * as "BREAKING CHANGES".
 * @returns {Function}
 */
module.exports = function transformCommitForSubRepositoryFactory( options = {} ) {
	/**
	 * @param {Commit} rawCommit
	 * @returns {Commit|undefined}
	 */
	return function transformCommitForSubRepository( rawCommit ) {
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
			return options.returnInvalidCommit ? commit : undefined;
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

		normalizeNotes( commit );

		// Clear the references array - we don't want to hoist the issues.
		delete commit.references;

		commit.repositoryUrl = utils.getRepositoryUrl();

		return commit;
	};

	function makeLinks( comment ) {
		comment = utils.linkToGithubIssue( comment );
		comment = utils.linkToGithubUser( comment );

		return comment;
	}

	function normalizeNotes( commit ) {
		for ( const note of commit.notes ) {
			// "BREAKING CHANGE" => "BREAKING CHANGES"
			if ( note.title === 'BREAKING CHANGE' ) {
				note.title = 'BREAKING CHANGES';
			}

			// "BREAKING CHANGES" => "MAJOR BREAKING CHANGES"
			if ( note.title === 'BREAKING CHANGES' ) {
				note.title = 'MAJOR BREAKING CHANGES';
			}

			// "MAJOR BREAKING CHANGE" => "MAJOR BREAKING CHANGES"
			if ( note.title === 'MAJOR BREAKING CHANGE' ) {
				note.title = 'MAJOR BREAKING CHANGES';
			}

			// "MINOR BREAKING CHANGE" => "MINOR BREAKING CHANGES"
			if ( note.title === 'MINOR BREAKING CHANGE' ) {
				note.title = 'MINOR BREAKING CHANGES';
			}

			// Replace "MAJOR" with "MINOR" if major breaking changes are "disabled".
			if ( options.treatMajorAsMinorBreakingChange && note.title === 'MAJOR BREAKING CHANGES' ) {
				note.title = 'MINOR BREAKING CHANGES';
			}

			// If explicit breaking changes groups option is disabled, let's remove MINOR/MAJOR prefix from the title.
			if ( !options.useExplicitBreakingChangeGroups ) {
				note.title = note.title.replace( /^(MINOR|MAJOR) /, '' );
			}

			note.text = makeLinks( note.text );
		}

		// Place all "NOTE" at the end.
		commit.notes.sort( ( a, b ) => {
			// Do not swap two notes. Their weight is equal to each other.
			if ( a.title === 'NOTE' && b.title === 'NOTE' ) {
				return 0;
			}

			if ( a.title === 'NOTE' ) {
				return 1;
			} else if ( b.title === 'NOTE' ) {
				return -1;
			}

			return 0;
		} );
	}
};

/**
 * @typedef {Object} Commit
 *
 * @property {String} rawType Type of the commit without any modifications.
 *
 * @property {String} type Type of the commit (it can be modified).
 *
 * @property {String} hash The commit SHA-1 id.
 *
 * @property {String} repositoryUrl The URL to the repository where the parsed commit has been done.
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
