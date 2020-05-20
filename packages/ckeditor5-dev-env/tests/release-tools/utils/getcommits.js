/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const getCommits = require( '../../../lib/release-tools/utils/getcommits' );

describe( 'dev-env/release-tools/utils', () => {
	let tmpCwd, cwd, transformCommit;

	describe( 'getNewReleaseType()', () => {
		before( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( __dirname + path.sep );
		} );

		after( () => {
			exec( `rm -rf ${ tmpCwd }` );
		} );

		beforeEach( () => {
			process.chdir( tmpCwd );

			exec( 'git init' );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}

			// Do not modify the commit.
			transformCommit = commit => commit;
		} );

		afterEach( () => {
			process.chdir( cwd );
			exec( `rm -rf ${ path.join( tmpCwd, '.git' ) }` );
		} );

		it( 'throws an error when repository is empty', () => {
			return getCommits( transformCommit )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					err => {
						expect( err.message ).to.equal( 'Given repository is empty.' );
					}
				);
		} );

		it( 'throws an error when repository is empty', () => {
			return getCommits( transformCommit, { from: 'foobar' } )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					err => {
						expect( err.message ).to.equal( 'Cannot find tag or commit "foobar" in given repository.' );
					}
				);
		} );

		it( 'returns an array of commits after "git init"', () => {
			exec( 'git commit --allow-empty --message "First."' );
			exec( 'git commit --allow-empty --message "Second."' );

			return getCommits( transformCommit )
				.then( commits => {
					expect( commits.length ).to.equal( 2 );
					expect( commits[ 0 ].header ).to.equal( 'Second.' );
					expect( commits[ 1 ].header ).to.equal( 'First.' );
				} );
		} );

		it( 'returns an array of commits after "git init" if `options.from` is not specified', () => {
			exec( 'git commit --allow-empty --message "First."' );
			exec( 'git commit --allow-empty --message "Second."' );
			exec( 'git tag v1.0.0' );
			exec( 'git commit --allow-empty --message "Third."' );
			exec( 'git commit --allow-empty --message "Fourth."' );

			return getCommits( transformCommit )
				.then( commits => {
					expect( commits.length ).to.equal( 4 );
					expect( commits[ 0 ].header ).to.equal( 'Fourth.' );
					expect( commits[ 1 ].header ).to.equal( 'Third.' );
					expect( commits[ 2 ].header ).to.equal( 'Second.' );
					expect( commits[ 3 ].header ).to.equal( 'First.' );
				} );
		} );

		it( 'returns an array of commits since last tag (`options.from` is specified)', () => {
			exec( 'git commit --allow-empty --message "First."' );
			exec( 'git commit --allow-empty --message "Second."' );
			exec( 'git tag v1.0.0' );
			exec( 'git commit --allow-empty --message "Third."' );
			exec( 'git commit --allow-empty --message "Fourth."' );

			return getCommits( transformCommit, { from: 'v1.0.0' } )
				.then( commits => {
					expect( commits.length ).to.equal( 2 );
					expect( commits[ 0 ].header ).to.equal( 'Fourth.' );
					expect( commits[ 1 ].header ).to.equal( 'Third.' );
				} );
		} );

		it( 'returns an array of commits since specified commit (`options.from` is specified)', () => {
			exec( 'git commit --allow-empty --message "First."' );
			exec( 'git commit --allow-empty --message "Second."' );
			exec( 'git tag v1.0.0' );
			exec( 'git commit --allow-empty --message "Third."' );

			const commitId = exec( 'git rev-parse HEAD' ).trim();

			exec( 'git commit --allow-empty --message "Fourth."' );

			return getCommits( transformCommit, { from: commitId } )
				.then( commits => {
					expect( commits.length ).to.equal( 1 );
					expect( commits[ 0 ].header ).to.equal( 'Fourth.' );
				} );
		} );

		it( 'ignores false values returned by the "transformCommit" mapper', () => {
			const transformCommit = sinon.stub();

			transformCommit.onFirstCall().callsFake( commit => commit );
			transformCommit.onSecondCall().callsFake( () => null );

			exec( 'git commit --allow-empty --message "First."' );
			exec( 'git commit --allow-empty --message "Second."' );

			return getCommits( transformCommit )
				.then( commits => {
					expect( commits.length ).to.equal( 1 );
					expect( commits[ 0 ].header ).to.equal( 'Second.' );
				} );
		} );

		it( 'handles arrays returned by the "transformCommit" mapper', () => {
			const transformCommit = sinon.stub();

			transformCommit.onFirstCall().callsFake( commit => {
				return [ commit, commit ];
			} );

			exec( 'git commit --allow-empty --message "First."' );

			return getCommits( transformCommit )
				.then( commits => {
					expect( commits.length ).to.equal( 2 );
					expect( commits[ 0 ].header ).to.equal( 'First.' );
					expect( commits[ 1 ].header ).to.equal( 'First.' );
				} );
		} );
	} );

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
} );
