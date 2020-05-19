/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const conventionalCommitsParser = require( 'conventional-commits-parser' );
const conventionalCommitsFilter = require( 'conventional-commits-filter' );
const gitRawCommits = require( 'git-raw-commits' );
const concat = require( 'concat-stream' );
const parserOptions = require( './parseroptions' );

/**
 * Returns a promise that resolves an array of commits since the last tag specified as `options.from`.
 *
 * @param {Function} transformCommit
 * @param {Object} options
 * @param {String} [options.from] A commit or tag name that will be the first param of the range of commits to collect.
 * @returns {Promise.<Array.<Commit>>}
 */
module.exports = function getCommits( transformCommit, options = {} ) {
	const gitRawCommitsOpts = {
		format: '%B%n-hash-%n%H',
		from: options.from,
		merges: undefined,
		firstParent: true
	};

	return new Promise( ( resolve, reject ) => {
		const stream = gitRawCommits( gitRawCommitsOpts )
			.on( 'error', err => {
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

		stream.pipe( conventionalCommitsParser( parserOptions ) )
			.pipe( concat( data => {
				const commits = conventionalCommitsFilter( data )
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
};
