/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseCommitsStream } from 'conventional-commits-parser';
import { filterRevertedCommitsSync } from 'conventional-commits-filter';
import { getRawCommitsStream } from 'git-raw-commits';
import concat from 'concat-stream';
import parserOptions from './parseroptions.js';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import shellEscape from 'shell-escape';

/**
 * Returns a promise that resolves an array of commits since the last tag specified as `options.from`.
 *
 * @param {function} transformCommit
 * @param {object} options
 * @param {string} [options.from] A commit or tag name that will be the first param of the range of commits to collect.
 * @param {string} [options.releaseBranch='master'] A name of the branch that should be used for releasing packages.
 * @param {string} [options.mainBranch='master'] A name of the main branch in the repository.
 * @returns {Promise.<Array.<Commit>>}
 */
export default function getCommits( transformCommit, options = {} ) {
	const releaseBranch = options.releaseBranch || 'master';
	const mainBranch = options.mainBranch || 'master';

	const currentBranch = exec( 'git rev-parse --abbrev-ref HEAD' ).trim();

	// Check whether current branch is the same as the release branch.
	if ( currentBranch !== releaseBranch ) {
		return Promise.reject( new Error(
			`Expected to be checked out on the release branch ("${ releaseBranch }") instead of "${ currentBranch }". Aborting.`
		) );
	}

	// If the release branch is the same as the main branch, we can collect all commits directly from the branch.
	if ( releaseBranch === mainBranch ) {
		return findCommits( { from: options.from } );
	} else {
		// Otherwise, (release branch is other than the main branch) we need to merge arrays of commits.
		// See: https://github.com/ckeditor/ckeditor5/issues/7492.
		const baseCommit = exec( `git merge-base ${ shellEscape( [ releaseBranch, mainBranch ] ) }` ).trim();

		const commitPromises = [
			// 1. Commits from the last release and to the point where the release branch was created (the merge-base commit).
			findCommits( { from: options.from, to: baseCommit } ),
			// 2. Commits from the merge-base commit to HEAD.
			findCommits( { from: baseCommit, to: 'HEAD' } )
		];

		return Promise.all( commitPromises )
			.then( commits => [].concat( ...commits ) );
	}

	function findCommits( gitRawCommitsOptions ) {
		const gitRawCommitsOpts = Object.assign( {}, gitRawCommitsOptions, {
			format: '%B%n-hash-%n%H',
			merges: undefined,
			firstParent: true
		} );

		return new Promise( ( resolve, reject ) => {
			const stream = getRawCommitsStream( gitRawCommitsOpts )
				.on( 'error', err => {
					/* istanbul ignore else */
					if ( err.message.match( /'HEAD': unknown/ ) ) {
						reject( new Error( 'Given repository is empty.' ) );
					} else if ( err.message.match( new RegExp( `'${ options.from }\\.\\.HEAD': unknown` ) ) ) {
						reject( new Error(
							`Cannot find tag or commit "${ options.from }" in given repository.`
						) );
					} else {
						reject( err );
					}
				} );

			stream.pipe( parseCommitsStream( parserOptions ) )
				.pipe( concat( data => {
					const commits = [ ...filterRevertedCommitsSync( data ) ]
						.map( commit => transformCommit( commit ) )
						.reduce( ( allCommits, commit ) => {
							if ( Array.isArray( commit ) ) {
								allCommits.push( ...commit );
							} else {
								allCommits.push( commit );
							}

							return allCommits;
						}, [] )
						.filter( commit => commit );

					stream.destroy();

					return resolve( commits );
				} ) );
		} );
	}

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
}
