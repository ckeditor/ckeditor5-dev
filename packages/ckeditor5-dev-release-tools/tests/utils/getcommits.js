/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import gitRawCommits from 'git-raw-commits';
import { tools } from '@ckeditor/ckeditor5-dev-utils';

describe( 'dev-release-tools/utils', () => {
	let tmpCwd, cwd, getCommits, stubs;

	describe( 'getCommits()', () => {
		beforeAll( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( __dirname + path.sep );
		} );

		afterAll( () => {
			fs.rmdirSync( tmpCwd );
		} );

		beforeEach( async () => {
			process.chdir( tmpCwd );

			exec( 'git init' );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}

			vi.doMock( 'git-raw-commits', () => ( {
				default: vi.fn( gitRawCommits )
			} ) );

			vi.doMock( '@ckeditor/ckeditor5-dev-utils' );

			stubs = {
				gitRawCommits: ( await import( 'git-raw-commits' ) ).default,
				devTools: ( await import( '@ckeditor/ckeditor5-dev-utils' ) ).tools
			};

			getCommits = ( await import( '../../lib/utils/getcommits.js' ) ).getCommits;
		} );

		afterEach( () => {
			process.chdir( cwd );
			fs.rmSync( path.join( tmpCwd, '.git' ), { recursive: true } );

			vi.resetModules();
		} );

		describe( 'branch for releasing is the same as the main branch', () => {
			beforeEach( async () => {
				vi.mocked( stubs.devTools.shExec ).mockReturnValueOnce( 'master\n' );
			} );

			it( 'throws an error when the specified release branch is not equal to the current checked out branch', () => {
				return getCommits( transformCommit, { releaseBranch: 'release' } )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						err => {
							expect( err.message ).toEqual(
								'Expected to be checked out on the release branch ("release") instead of "master". Aborting.'
							);
						}
					);
			} );

			it( 'throws an error when the default release branch is not equal to the current checked out branch', () => {
				vi.mocked( stubs.devTools.shExec ).mockReset();
				vi.mocked( stubs.devTools.shExec ).mockReturnValueOnce( 'release\n' );

				return getCommits( transformCommit )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						err => {
							expect( err.message ).toEqual(
								'Expected to be checked out on the release branch ("master") instead of "release". Aborting.'
							);
						}
					);
			} );

			it( 'throws an error when repository is empty', () => {
				return getCommits( transformCommit )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						err => {
							expect( err.message ).toEqual( 'Given repository is empty.' );
						}
					);
			} );

			it( 'throws an error when there is no tag or commit with specified name in given repository', () => {
				return getCommits( transformCommit, { from: 'foobar' } )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						err => {
							expect( err.message ).toEqual( 'Cannot find tag or commit "foobar" in given repository.' );
						}
					);
			} );

			it( 'returns an array of commits after "git init"', () => {
				exec( 'git commit --allow-empty --message "First."' );
				exec( 'git commit --allow-empty --message "Second."' );

				return getCommits( transformCommit )
					.then( commits => {
						expect( commits.length ).toEqual( 2 );
						expect( commits[ 0 ].header ).toEqual( 'Second.' );
						expect( commits[ 1 ].header ).toEqual( 'First.' );
					} );
			} );

			it( 'returns an array of commits after "git init" (main branch is not equal to "master")', () => {
				vi.mocked( stubs.devTools.shExec ).mockReset();
				vi.mocked( stubs.devTools.shExec ).mockReturnValueOnce( 'main-branch\n' );

				exec( 'git checkout -b main-branch' );
				exec( 'git commit --allow-empty --message "First."' );
				exec( 'git commit --allow-empty --message "Second."' );

				return getCommits( transformCommit, { mainBranch: 'main-branch', releaseBranch: 'main-branch' } )
					.then( commits => {
						expect( commits.length ).toEqual( 2 );
						expect( commits[ 0 ].header ).toEqual( 'Second.' );
						expect( commits[ 1 ].header ).toEqual( 'First.' );
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
						expect( commits.length ).toEqual( 4 );
						expect( commits[ 0 ].header ).toEqual( 'Fourth.' );
						expect( commits[ 1 ].header ).toEqual( 'Third.' );
						expect( commits[ 2 ].header ).toEqual( 'Second.' );
						expect( commits[ 3 ].header ).toEqual( 'First.' );
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
						expect( commits.length ).toEqual( 2 );
						expect( commits[ 0 ].header ).toEqual( 'Fourth.' );
						expect( commits[ 1 ].header ).toEqual( 'Third.' );
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
						expect( commits.length ).toEqual( 1 );
						expect( commits[ 0 ].header ).toEqual( 'Fourth.' );
					} );
			} );

			it( 'ignores false values returned by the "transformCommit" mapper', () => {
				const transformCommit = vi.fn()
					.mockImplementationOnce( commit => commit )
					.mockImplementationOnce( () => null );

				exec( 'git commit --allow-empty --message "First."' );
				exec( 'git commit --allow-empty --message "Second."' );

				return getCommits( transformCommit )
					.then( commits => {
						expect( commits.length ).toEqual( 1 );
						expect( commits[ 0 ].header ).toEqual( 'Second.' );
					} );
			} );

			it( 'handles arrays returned by the "transformCommit" mapper', () => {
				const transformCommit = vi.fn()
					.mockImplementationOnce( commit => {
						return [ commit, commit ];
					} );

				exec( 'git commit --allow-empty --message "First."' );

				return getCommits( transformCommit )
					.then( commits => {
						expect( commits.length ).toEqual( 2 );
						expect( commits[ 0 ].header ).toEqual( 'First.' );
						expect( commits[ 1 ].header ).toEqual( 'First.' );
					} );
			} );
		} );

		describe( 'branch for releasing is other than the main branch', () => {
			it( 'collects commits from the main branch and the release branch', () => {
				vi.mocked( stubs.devTools.shExec ).mockReturnValueOnce( 'release\n' );
				vi.mocked( stubs.devTools.shExec ).mockImplementationOnce( exec );

				exec( 'git commit --allow-empty --message "Type: master: 1."' );
				exec( 'git tag v1.0.0' );

				// Commits on master and release branches will be parsed.
				exec( 'git commit --allow-empty --message "Type: master: 2."' );
				exec( 'git commit --allow-empty --message "Type: master: 3."' );
				exec( 'git commit --allow-empty --message "Type: master: 4."' );

				exec( 'git checkout -b i/100' );
				exec( 'git commit --allow-empty --message "Type: i/100: 1."' );
				exec( 'git commit --allow-empty --message "Type: i/100: 2."' );
				exec( 'git checkout master' );
				exec( 'git merge i/100 --no-ff --message "Type: Merge i/100. master: 5"' );

				exec( 'git checkout -b i/200' );
				exec( 'git commit --allow-empty --message "Type: i/200: 1."' );
				exec( 'git commit --allow-empty --message "Type: i/200: 2."' );
				exec( 'git commit --allow-empty --message "Type: i/200: 3."' );
				exec( 'git checkout master' );
				exec( 'git merge i/200 --no-ff --message "Type: Merge i/200. master: 6"' );

				const baseCommit = exec( 'git rev-parse HEAD' ).trim();

				exec( 'git checkout -b release' );
				exec( 'git commit --allow-empty --message "Type: release: 1, master 7."' );

				exec( 'git checkout -b i/300' );
				exec( 'git commit --allow-empty --message "Type: i/300: 1."' );
				exec( 'git commit --allow-empty --message "Type: i/300: 2."' );
				exec( 'git checkout release' );
				exec( 'git merge i/300 --no-ff --message "Type: Merge i/300. release: 2, master: 8"' );

				exec( 'git commit --allow-empty --message "Type: release: 3, master 9."' );
				exec( 'git branch -D i/100 i/200 i/300' );

				return getCommits( transformCommit, { from: 'v1.0.0', releaseBranch: 'release' } )
					.then( commits => {
						expect( commits.length ).toEqual( 8 );

						expect( stubs.gitRawCommits ).toHaveBeenNthCalledWith( 1, {
							from: 'v1.0.0',
							to: baseCommit,
							format: '%B%n-hash-%n%H',
							merges: undefined,
							firstParent: true
						} );

						expect( stubs.gitRawCommits ).toHaveBeenNthCalledWith( 2, {
							to: 'HEAD',
							from: baseCommit,
							format: '%B%n-hash-%n%H',
							merges: undefined,
							firstParent: true
						} );
					} );
			} );
		} );
	} );
} );

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}

// Do not modify the commit.
function transformCommit( commit ) {
	return commit;
}
