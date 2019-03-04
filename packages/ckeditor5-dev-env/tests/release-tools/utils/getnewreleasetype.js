/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const transformCommitForSubRepository = require( '../../../lib/release-tools/utils/transform-commit/transformcommitforsubrepository' );

describe( 'dev-env/release-tools/utils', () => {
	let getNewReleaseType, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		stubs = {
			transformCommit: sandbox.stub().callsFake( commit => {
				commit.rawType = commit.type;
				commit.hash = commit.hash.substring( 0, 7 );

				return commit;
			} ),
			versionUtils: {
				getLastFromChangelog: sandbox.stub()
			},
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			}
		};

		getNewReleaseType = proxyquire( '../../../lib/release-tools/utils/getnewreleasetype', {
			'./versions': stubs.versionUtils,
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					return stubs.logger;
				}
			}
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'getNewReleaseType()', () => {
		let tmpCwd, cwd, packageJson, displayCommits, displayCommitsSpy;

		before( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( __dirname + path.sep );
		} );

		after( () => {
			exec( `rm -rf ${ tmpCwd }` );
		} );

		beforeEach( () => {
			displayCommits = getNewReleaseType._displayCommits;
			getNewReleaseType._displayCommits = displayCommitsSpy = sandbox.spy();

			process.chdir( tmpCwd );

			exec( 'git init' );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}

			packageJson = {
				name: 'test-package',
				bugs: 'some-url'
			};

			fs.writeFileSync( path.join( tmpCwd, 'package.json' ), JSON.stringify( packageJson, null, '\t' ) );
		} );

		afterEach( () => {
			getNewReleaseType._displayCommits = displayCommits;

			process.chdir( cwd );
			exec( `rm -rf ${ path.join( tmpCwd, '.git' ) }` );
		} );

		it( 'throws an error when repository is empty', () => {
			return getNewReleaseType( stubs.transformCommit )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					err => {
						expect( err.message ).to.equal( 'Given repository is empty.' );
					}
				);
		} );

		it( 'throws an error when given tag does not exist', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.1.2' } )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					err => {
						expect( err.message ).to.equal(
							'Cannot find tag "v1.1.2" (the latest version from the changelog) in given repository.'
						);
					}
				);
		} );

		it( 'returns "skip" release for invalid commits', () => {
			exec( 'git commit --allow-empty --message "Foo Bar."' );
			exec( 'git commit --allow-empty --message "Foo Bar even more..."' );

			stubs.transformCommit.returns( undefined );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'skip' );
				} );
		} );

		it( 'returns "patch" release for non-feature commits', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Other: Some change."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( displayCommitsSpy.called ).to.equal( true );
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'ignores notes from commits which will not be included in changelog', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Docs: Nothing." --message "BREAKING CHANGES: It should not bump the major."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( displayCommitsSpy.called ).to.equal( true );
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'returns "minor" release for feature commit', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Feature: Nothing new."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( displayCommitsSpy.called ).to.equal( true );
					expect( response.releaseType ).to.equal( 'minor' );
				} );
		} );

		it( 'returns "major" if any visible in changelog commit has breaking changes', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Feature: Nothing new."' );
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "BREAKING CHANGES: Bump the major!"' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( displayCommitsSpy.called ).to.equal( true );
					expect( response.releaseType ).to.equal( 'major' );
				} );
		} );

		it( 'returns "skip" if there is no commit since the last release', () => {
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "BREAKING CHANGES: Bump the major!"' );
			exec( 'git tag v1.0.0' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.0.0' } )
				.then( response => {
					expect( displayCommitsSpy.called ).to.equal( true );
					expect( response.releaseType ).to.equal( 'skip' );
				} );
		} );

		it( 'returns "internal" release for internal commits since the last release', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git tag v1.0.0' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #1."' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #2."' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #3."' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.0.0' } )
				.then( response => {
					expect( displayCommitsSpy.called ).to.equal( true );
					expect( response.releaseType ).to.equal( 'internal' );
				} );
		} );

		it( 'transforms each commit since the last release', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Feature: Nothing new."' );
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "BREAKING CHANGES: Bump the major!"' );
			exec( 'git tag v1.0.0' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #1."' );
			exec( 'git commit --allow-empty --message "Other: Nothing."' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #2."' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.0.0' } )
				.then( () => {
					// transformCommit should be called for commits:
					// (1) Docs: Added some notes to README #1.
					// (2) Other: Nothing.
					// (3) Docs: Added some notes to README #2.
					expect( stubs.transformCommit.calledThrice ).to.equal( true );
				} );
		} );
	} );

	describe( '_displayCommits()', () => {
		let displayCommits;

		beforeEach( () => {
			displayCommits = getNewReleaseType._displayCommits;
		} );

		it( 'attaches valid "external" commit to the changelog', () => {
			const rawCommit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit );

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Fix: Simple fix.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'truncates too long commit\'s subject', () => {
			const rawCommit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Reference site about Lorem Ipsum, giving information on its origins, as well as ' +
				'a random Lipsum generator.',
				type: 'Fix',
				subject: 'Reference site about Lorem Ipsum, giving information on its origins, as well as ' +
				'a random Lipsum generator.',
				body: null,
				footer: null,
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit );

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes(
				'Fix: Reference site about Lorem Ipsum, giving information on its origins, as well as a random Lip...'
			) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'does not attach valid "internal" commit to the changelog', () => {
			const rawCommit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Docs: README.',
				type: 'Docs',
				subject: 'README.',
				body: null,
				footer: null,
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit, { returnInvalidCommit: true } );

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Docs: README.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'SKIPPED' ) ).to.equal( true );
		} );

		it( 'does not attach invalid commit to the changelog', () => {
			const rawCommit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Invalid commit.',
				type: null,
				subject: null,
				body: null,
				footer: null,
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit, { returnInvalidCommit: true } );

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Invalid commit.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INVALID' ) ).to.equal( true );
		} );

		it( 'attaches additional subject for merge commits to the commit list', () => {
			const rawCommit = {
				merge: 'Merge pull request #75 from ckeditor/t/64',
				hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
				header: 'Feature: Introduced a brand new release tools with a new set of requirements.',
				type: 'Feature',
				subject: 'Introduced a brand new release tools with a new set of requirements.',
				body: null,
				footer: null,
				mentions: [],
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit );

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.be.a( 'string' );

			const logMessageAsArray = stubs.logger.info.firstCall.args[ 0 ].split( '\n' );

			expect( logMessageAsArray[ 0 ].includes(
				'Feature: Introduced a brand new release tools with a new set of requirements.'
			) ).to.equal( true );
			expect( logMessageAsArray[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
			expect( logMessageAsArray[ 1 ].includes( 'Merge pull request #75 from ckeditor/t/64' ) ).to.equal( true );
		} );

		it( 'displays proper log if commit does not contain the second line', () => {
			const rawCommit = {
				type: null,
				subject: null,
				merge: 'Merge branch \'master\' of github.com:ckeditor/ckeditor5-dev',
				header: '-hash-',
				body: '575e00bc8ece48826adefe226c4fb1fe071c73a7',
				footer: null,
				notes: [],
				references: [],
				mentions: [],
				revert: null
			};

			const commit = transformCommitForSubRepository( rawCommit, { returnInvalidCommit: true } );

			displayCommits( [ commit ] );

			// The merge commit displays two lines:
			// Prefix: Changes.
			// Merge ...
			// If the merge commit does not contain the second line, it should display only the one.
			expect( stubs.logger.info.firstCall.args[ 0 ].split( '\n' ) ).length( 1 );
		} );
	} );

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
} );
