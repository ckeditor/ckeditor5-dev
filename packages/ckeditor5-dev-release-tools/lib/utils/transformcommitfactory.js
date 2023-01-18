/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { cloneDeepWith } = require( 'lodash' );
const utils = require( './transformcommitutils' );
const getChangedFilesForCommit = require( './getchangedfilesforcommit' );

/**
 * Factory function.
 *
 * It returns a function that parses a single commit:
 *   - makes links to issues and organizations on GitHub,
 *   - if the commit contains multi changelog entries, the function will return an array of the commits,
 *   - if the commit touches multiple scopes, the commit is cloned as many times as the number of packages in its scope,
 *   - normalizes notes (e.g. "MAJOR BREAKING CHANGE" will be replaced with "MAJOR BREAKING CHANGES"),
 *   - the commit is always being returned. Even, if it should not be added to the changelog.
 *
 * @param {Object} [options={}]
 * @param {Boolean} [options.treatMajorAsMinorBreakingChange=false] If set on true, all "MAJOR BREAKING CHANGES" notes will be replaced
 * with "MINOR BREAKING CHANGES". This behaviour is being disabled automatically if `options.useExplicitBreakingChangeGroups` is
 * set on `false` because all commits will be treated as "BREAKING CHANGES".
 * @param {Boolean} [options.useExplicitBreakingChangeGroups] If set on `true`, notes from parsed commits will be grouped as
 * "MINOR BREAKING CHANGES" and "MAJOR BREAKING CHANGES'. If set on `false` (by default), all breaking changes notes will be treated
 * as "BREAKING CHANGES".
 * @returns {Function}
 */
module.exports = function transformCommitFactory( options = {} ) {
	return rawCommit => {
		const commit = transformCommit( rawCommit );

		if ( !commit ) {
			return commit;
		}

		if ( Array.isArray( commit ) ) {
			return commit.flatMap( splitMultiScopeCommit );
		}

		return splitMultiScopeCommit( commit );
	};

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
	 * In most of cases the function will return the commit (even if its structure is invalid). However, "Merge branch 'stable'" commits
	 * will be always ignored and `undefined` will be returned.
	 *
	 * @param {Commit} rawCommit
	 * @returns {Commit|Array.<Commit>|undefined}
	 */
	function transformCommit( rawCommit ) {
		// Let's clone the commit. We don't want to modify the reference.
		const commit = Object.assign( {}, rawCommit, {
			// Copy the original `type` of the commit.
			rawType: rawCommit.type,
			notes: rawCommit.notes.map( note => Object.assign( {}, note ) )
		} );

		const parsedType = extractScopeFromPrefix( commit.rawType );

		commit.files = [];
		commit.rawType = parsedType.rawType;
		commit.scope = parsedType.scope;

		// Whether the commit will be printed in the changelog.
		commit.isPublicCommit = utils.availableCommitTypes.get( commit.rawType ) || false;

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
		if ( isInternalMergeCommit( commit ) ) {
			return;
		}

		commit.files = getChangedFilesForCommit( commit.hash ) || [];
		commit.repositoryUrl = utils.getRepositoryUrl();

		if ( commit.isPublicCommit ) {
			// Remove [skip ci] from the commit subject.
			commit.subject = commit.subject.replace( /\[skip ci\]/, '' ).trim();

			// If a dot is missing at the end of the subject...
			if ( !commit.subject.endsWith( '.' ) ) {
				// ...let's add it.
				commit.subject += '.';
			}

			// The `type` below will be key for grouping commits.
			commit.type = utils.getCommitType( commit.rawType );
			commit.subject = mergeCloseReferences( commit.subject );
			commit.subject = makeLinks( commit.subject );

			// Remove additional notes from the commit's footer.
			// Additional notes are added to the footer. In order to avoid duplication, they should be removed.
			if ( commit.footer && commit.notes.length ) {
				// Clone the notes in order to avoid cleaning those.
				const commitsNotes = commit.notes.slice();

				commit.footer = commit.footer.split( '\n' )
					.filter( footerLine => {
						// For each footer line checks whether the line starts with note prefix.
						// If so, this footer line should be removed.
						const noteToRemove = commitsNotes.find( note => {
							return footerLine.startsWith( note.title ) && footerLine.endsWith( note.text );
						} );

						// In order to avoid checking the same note, remove it.
						if ( noteToRemove ) {
							commitsNotes.splice( commitsNotes.indexOf( noteToRemove ), 1 );
						}

						return !noteToRemove;
					} )
					.join( '\n' )
					.trim() || null;
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
			}

			normalizeNotes( commit );

			// Clear the references array - we don't want to hoist the issues.
			delete commit.references;
		}

		if ( !commit.body ) {
			// It's used only for displaying the commit. Changelog generator will filter out the invalid entries.
			return commit;
		}

		const commitEntries = commit.body.match( utils.MULTI_ENTRIES_COMMIT_REGEXP );

		// The commit does not provide additional entries.
		if ( !commitEntries || !commitEntries.length ) {
			commit.body = makeLinks( commit.body );

			return commit;
		}

		// Single commit contains a few entries that should be inserted to the changelog.
		// All of those entries are defined in the array.
		// Additional commits/entries will be called as "fake commits".
		const separatedCommits = [ commit ];

		// Descriptions of additional entries.
		const parts = commit.body.split( utils.MULTI_ENTRIES_COMMIT_REGEXP );

		// If the descriptions array contains more entries than fake commit entries,
		// it means that the first element in descriptions array describes the main (real) commit.
		/* istanbul ignore else */
		if ( parts.length > commitEntries.length ) {
			commit.body = escapeNewLines( parts.shift() );
			commit.body = makeLinks( commit.body );
		}

		// For each fake commit, copy hash and repository of the parent.
		for ( let i = 0; i < parts.length; ++i ) {
			const newCommit = {
				revert: null,
				merge: null,
				footer: null,
				hash: commit.hash,
				files: commit.files,
				repositoryUrl: commit.repositoryUrl,
				notes: [],
				mentions: []
			};

			const details = extractScopeFromPrefix( commitEntries[ i ].replace( /:$/, '' ) );

			newCommit.rawType = details.rawType;
			newCommit.scope = details.scope;
			newCommit.isPublicCommit = utils.availableCommitTypes.get( newCommit.rawType );

			if ( newCommit.isPublicCommit ) {
				newCommit.type = utils.getCommitType( newCommit.rawType );
			}

			const commitDescription = parts[ i ];
			const subject = commitDescription.match( /^(.*)$/m )[ 0 ];

			newCommit.header = commitEntries[ i ].trim() + ' ' + subject.trim();

			newCommit.subject = mergeCloseReferences( subject.trim() );
			newCommit.subject = makeLinks( newCommit.subject );

			newCommit.body = escapeNewLines( commitDescription.replace( subject, '' ) );
			newCommit.body = makeLinks( newCommit.body );

			// If a dot is missing at the end of the subject...
			if ( !newCommit.subject.endsWith( '.' ) ) {
				// ...let's add it.
				newCommit.subject += '.';
			}

			separatedCommits.push( newCommit );
		}

		return separatedCommits;
	}

	/**
	 * Merges multiple "Closes #x" references as "Closes #x, #y.".
	 *
	 * @param {String} subject
	 * @returns {String}
	 */
	function mergeCloseReferences( subject ) {
		const refs = [];

		let newSubject = subject;
		let insertedPlaceholder = false;

		const regexp = /Closes (\/?[\w-]+\/[\w-]+)?#([\d]+)\./ig;
		let match;

		while ( ( match = regexp.exec( subject ) ) ) {
			const [ matchedText, maybeRepository, issueId ] = match;

			if ( maybeRepository ) {
				refs.push( maybeRepository + '#' + issueId );
			} else {
				refs.push( '#' + issueId );
			}

			if ( insertedPlaceholder ) {
				newSubject = newSubject.replace( matchedText, '' ).trim();
			} else {
				insertedPlaceholder = true;
				newSubject = newSubject.replace( matchedText, '[[--COMMIT_REFERENCES--]]' ).trim();
			}
		}

		newSubject = newSubject.replace( /\[\[--COMMIT_REFERENCES--\]] ?/, 'Closes ' + refs.join( ', ' ) + '.' );

		return newSubject;
	}

	function makeLinks( comment ) {
		comment = utils.linkToGithubIssue( comment );
		comment = utils.linkToGithubUser( comment );

		return comment;
	}

	function normalizeNotes( commit ) {
		for ( const note of commit.notes ) {
			const details = extractScopeFromNote( note.text );

			note.text = details.text;
			note.scope = details.scope;

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

			// If explicit breaking changes groups option is disabled, remove MINOR/MAJOR prefix from the title.
			if ( !options.useExplicitBreakingChangeGroups ) {
				note.title = note.title.replace( /^(MINOR|MAJOR) /, '' );
			}

			note.text = makeLinks( note.text );
		}
	}

	/**
	 * Extracts the prefix and scope from the `Commit#subject`.
	 *
	 * E.g.:
	 *   - input: `Fix (engine): Fixed...
	 *   - output: { rawType: 'Fix', scope: [ 'engine' ] }
	 *
	 * For commits with no scope, `null` will be returned instead of the array (as `scope`).
	 *
	 * @param {String} type First line from the commit message.
	 * @returns {Object}
	 */
	function extractScopeFromPrefix( type ) {
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
				.filter( p => p )
				.sort();
		}

		return data;
	}

	/**
	 * Extracts the prefix and scope from the `CommitNote#text`.
	 *
	 * E.g.:
	 *   - input: `(engine): Removed...
	 *   - output: { text: 'Removed...', scope: [ 'engine' ] }
	 *
	 * For notes with no scope, `null` will be returned instead of the array (as `scope`).
	 *
	 * @param {String} text A text that describes a note.
	 * @returns {Object}
	 */
	function extractScopeFromNote( text ) {
		const scopeAsText = text.match( /\(([^)]+)\):/ );

		if ( !scopeAsText ) {
			return {
				text,
				scope: null
			};
		}

		const scope = scopeAsText[ 1 ]
			.split( ',' )
			.map( p => p.trim() )
			.filter( p => p )
			.sort();

		return {
			text: text.replace( scopeAsText[ 0 ], '' ).trim(),
			scope
		};
	}

	function escapeNewLines( message ) {
		// Accept spaces before a sentence because they are ready to be rendered in the changelog template.
		return message.replace( /^\n+|\s+$/g, '' );
	}

	function isInternalMergeCommit( commit ) {
		if ( !commit.merge ) {
			return false;
		}

		// Internal merges between branches. When creating a release, synchronising the documentation, etc.
		// Also merge those branches into the feature branch.
		if ( commit.merge.match( /^Merge( branch)? '?(master|release|stable)'?( into '?(master|release|stable)'?)?/ ) ) {
			return true;
		}

		// Merge `origin/master` into the feature branch.
		if ( commit.merge.match( /^Merge remote-tracking branch 'origin\/master/ ) ) {
			return true;
		}

		return false;
	}

	/**
	 * If the commit touches multiple scopes (packages), clone this commit as many times as the number of packages in the scope.
	 * Then, for each cloned commit, set the scope value to be a single package. Other commit properties remain unchanged.
	 *
	 * This correction is needed, because otherwise a changelog entry would be generated only for the first found scope.
	 *
	 * @param {Commit} commit
	 * @returns {Commit|Array.<Commit>}
	 */
	function splitMultiScopeCommit( commit ) {
		if ( !commit.scope ) {
			return commit;
		}

		if ( commit.scope.length === 1 ) {
			return commit;
		}

		// Clone the commit as many times as there are scopes.
		return commit.scope.map( ( scope, index ) => cloneDeepWith( commit, ( value, key, parent ) => {
			// The cloned commit should always have a single scope from a commit.
			// Do not copy scopes from commit notes.
			if ( key === 'scope' && !parent.title ) {
				return [ scope ];
			}

			// Do not copy breaking changes notes. It's enough to keep them in the first commit.
			if ( index && key === 'notes' ) {
				return [];
			}
		} ) );
	}
};

/**
 * @typedef {Object} Commit
 *
 * @property {Boolean} isPublicCommit Whether the commit should be added in the changelog.
 *
 * @property {String} rawType Type of the commit without any modifications.
 *
 * @property {String} type Type of the commit (it can be modified).
 *
 * @property {String} header First line of the commit message.
 *
 * @property {String} subject Subject of the commit. It's the header without the type.
 *
 * @property {Array.<String>|null} scope Scope of the changes.
 *
 * @property {Array.<String>} files A list of files tha the commit modified.
 *
 * @property {String} hash The full commit SHA-1 id.
 *
 * @property {String} repositoryUrl The URL to the repository where the parsed commit has been done.
 **
 * @property {String|null} [body] Body of the commit message.
 *
 * @property {String|null} [footer] Footer of the commit message.
 *
 * @property {Array.<CommitNote>} [notes] Notes for the commit.
 *
 * @property {Boolean} [skipCommitsLink] Whether to skip generating a URL to the commit by the generator.
 */

/**
 * @typedef {Object} CommitNote
 *
 * @property {String} title Type of the note.
 *
 * @property {String} text Text of the note.
 *
 * @property {Array.<String>} scope Scope of the note.
 */
