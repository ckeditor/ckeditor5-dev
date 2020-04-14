/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const utils = require( './transform-commit-utils' );

const MULTI_ENTRIES_COMMIT_REGEXP = /(?:Feature|Other|Fix)(?: \([\w\-, ]+?\))?:/g;

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
	 * If returned an instance of the Array, it means that single commit contains more than one entry for the changelog.
	 *
	 * E.g. for the commit below:
	 *
	 *      Feature: Introduced the `Editor` component. See #123.
	 *
	 *      Additional description.
	 *
	 *      Fix: The commit also fixes...
	 *
	 * the function will return an array with two commits. The first one is the real commit, the second one is a fake commit
	 * but its description will be inserted to the changelog.
	 *
	 * @param {Commit} rawCommit
	 * @returns {Commit|Array.<Commit>|undefined}
	 */
	return function transformCommitForSubRepository( rawCommit ) {
		// Let's clone the commit. We don't want to modify the reference.
		const commit = Object.assign( {}, rawCommit, {
			// Copy the original `type` of the commit.
			rawType: rawCommit.type,
			notes: rawCommit.notes.map( note => Object.assign( {}, note ) )
		} );

		const parsedType = getTypeAndScope( commit.rawType );

		commit.rawType = parsedType.rawType;
		commit.scope = parsedType.scope;

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

		if ( !commit.body ) {
			return commit;
		}

		const commitEntries = commit.body.match( MULTI_ENTRIES_COMMIT_REGEXP );

		if ( !commitEntries.length ) {
			return commit;
		}

		// Single commit contains a few entries that should be inserted to the changelog.
		// All of those entries are defined in the array.
		// Additional commits/entries will be called as "fake commits".
		const separatedCommit = [ commit ];

		// Descriptions of additional entries.
		const parts = commit.body.split( MULTI_ENTRIES_COMMIT_REGEXP );

		// If the descriptions array contains more entries than fake commit entries,
		// it means that the first element in descriptions array describes the main (real) commit.
		if ( parts.length > commitEntries.length ) {
			commit.body = escapeNewLines( parts.shift() );
		} else {
			commit.body = null;
		}

		// For each fake commit, copy hash and repository of the parent.
		for ( let i = 0; i < parts.length; ++i ) {
			const newCommit = {
				hash: commit.hash,
				repositoryUrl: commit.repositoryUrl,
				notes: []
			};

			const details = getTypeAndScope( commitEntries[ i ].replace( /:$/, '' ) );

			newCommit.rawType = details.rawType;
			newCommit.scope = details.scope;
			newCommit.type = utils.getCommitType( newCommit.rawType );

			const commitDescription = parts[ i ];
			const subject = commitDescription.match( /^(.*)$/m )[ 0 ];

			newCommit.subject = subject.trim();
			newCommit.body = escapeNewLines( commitDescription.replace( subject, '' ) );

			separatedCommit.push( newCommit );
		}

		return separatedCommit;
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

	function getTypeAndScope( type ) {
		if ( !type ) {
			return {};
		}

		const parts = type.split( ' (' );
		const data = {
			rawType: parts[ 0 ],
			scope: null
		};

		if ( parts[ 1 ] ) {
			data.scope = parts[ 1 ].replace( /^\(|\)$/g, '' )
				.split( ',' )
				.map( p => p.trim() )
				.filter( p => p );
		}

		return data;
	}

	function escapeNewLines( message ) {
		// Accept spaces before a sentence because they are ready to be rendered in the changelog template.
		return message.replace(/^\n+|\s+$/g, '');
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
