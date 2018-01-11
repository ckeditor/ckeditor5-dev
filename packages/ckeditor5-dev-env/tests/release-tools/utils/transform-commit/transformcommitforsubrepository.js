/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils/transform-commit', () => {
	describe( 'transformCommitForSubRepository()', () => {
		let transformCommitForSubRepository, sandbox, stubs, loggerVerbosity, packageJson;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				logger: {
					info: sandbox.spy(),
					warning: sandbox.spy(),
					error: sandbox.spy()
				}
			};

			packageJson = {
				name: 'ckeditor5-dev',
				bugs: 'https://github.com/ckeditor/ckeditor5-dev/issues'
			};

			transformCommitForSubRepository = proxyquire(
				'../../../../lib/release-tools/utils/transform-commit/transformcommitforsubrepository',
				{
					'@ckeditor/ckeditor5-dev-utils': {
						logger( verbosity ) {
							loggerVerbosity = verbosity;

							return stubs.logger;
						}
					}
				}
			);
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'groups "BREAKING CHANGES" and "BREAKING CHANGE" as a single group', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: [
					{ title: 'BREAKING CHANGE', text: 'Note 1.' },
					{ title: 'BREAKING CHANGES', text: 'Note 2.' }
				]
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( commit.notes[ 0 ].title ).to.equal( 'BREAKING CHANGES' );
			expect( commit.notes[ 1 ].title ).to.equal( 'BREAKING CHANGES' );
		} );

		it( 'attaches valid "external" commit to the changelog', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Fix: Simple fix.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'truncates too long commit\'s subject', () => {
			const commit = {
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

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes(
				'Fix: Reference site about Lorem Ipsum, giving information on its origins, as well as a random Lip...'
			) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'does not attach valid "internal" commit to the changelog', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Docs: README.',
				type: 'Docs',
				subject: 'README.',
				body: null,
				footer: null,
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Docs: README.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'SKIPPED' ) ).to.equal( true );
		} );

		it( 'does not attach invalid commit to the changelog', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Invalid commit.',
				type: null,
				subject: null,
				body: null,
				footer: null,
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Invalid commit.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INVALID' ) ).to.equal( true );
		} );

		it( 'makes proper links in the commit subject', () => {
			const commit = {
				hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
				header: 'Fix: Simple fix. See ckeditor/ckeditor5#1. Thanks to @CKEditor. Closes #2.',
				type: 'Fix',
				subject: 'Simple fix. See ckeditor/ckeditor5#1. Thanks to @CKEditor. Closes #2.',
				body: null,
				footer: null,
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			const expectedSubject = 'Simple fix. ' +
				'See [ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1). ' +
				'Thanks to [@CKEditor](https://github.com/CKEditor). ' +
				'Closes [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).';

			expect( commit.subject ).to.equal( expectedSubject );
		} );

		it( 'makes proper links in the commit body', () => {
			const commit = {
				hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
				header: 'Fix: Simple fix. Closes #2.',
				type: 'Fix',
				subject: 'Simple fix. Closes #2',
				body: 'See ckeditor/ckeditor5#1. Thanks to @CKEditor. Read more #2.',
				footer: null,
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			// Remember about the indent in commit body.
			const expectedBody = '  See [ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1). ' +
				'Thanks to [@CKEditor](https://github.com/CKEditor). ' +
				'Read more [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).';

			expect( commit.body ).to.equal( expectedBody );
		} );

		it( 'makes proper links in the commit notes', () => {
			const commit = {
				hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
				header: 'Fix: Simple fix. Closes #2.',
				type: 'Fix',
				subject: 'Simple fix. Closes #2',
				body: null,
				footer: null,
				notes: [
					{
						title: 'BREAKING CHANGES',
						text: 'See ckeditor/ckeditor5#1. Thanks to @CKEditor.'
					},
					{
						title: 'NOTE',
						text: 'Read more #2.'
					}
				]
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			const expectedFirstNoteText = 'See [ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1). ' +
				'Thanks to [@CKEditor](https://github.com/CKEditor).';

			// eslint-disable-next-line max-len
			const expectedSecondNodeText = 'Read more [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).';

			expect( commit.notes[ 0 ].text ).to.equal( expectedFirstNoteText );
			expect( commit.notes[ 1 ].text ).to.equal( expectedSecondNodeText );
		} );

		it( 'attaches additional commit description with correct indent', () => {
			const commitDescription = [
				'* Release task - rebuilt module for collecting dependencies to release.',
				'* Used `semver` package for bumping the version (instead of a custom module).',
			];

			const commitDescriptionWithIndents = [
				'  * Release task - rebuilt module for collecting dependencies to release.',
				'  * Used `semver` package for bumping the version (instead of a custom module).',
			].join( '\n' );

			const commit = {
				header: 'Feature: Introduced a brand new release tools with a new set of requirements. See #64.',
				hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
				body: commitDescription.join( '\n' ),
				footer: null,
				mentions: [],
				type: 'Feature',
				subject: 'Introduced a brand new release tools with a new set of requirements. See #64.',
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( commit.type ).to.equal( 'Features' );
			expect( commit.subject ).to.equal( 'Introduced a brand new release tools with a new set of requirements. ' +
				'See [#64](https://github.com/ckeditor/ckeditor5-dev/issues/64).' );
			expect( commit.body ).to.equal( commitDescriptionWithIndents );

			expect( stubs.logger.info.calledOnce ).to.equal( true );

			expect( stubs.logger.info.firstCall.args[ 0 ].includes(
				'Feature: Introduced a brand new release tools with a new set of requirements. See #64.'
			) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'attaches additional subject for merge commits to the commit list', () => {
			const commit = {
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

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.be.a( 'string' );

			const logMessageAsArray = stubs.logger.info.firstCall.args[ 0 ].split( '\n' );

			expect( logMessageAsArray[ 0 ].includes(
				'Feature: Introduced a brand new release tools with a new set of requirements.'
			) ).to.equal( true );
			expect( logMessageAsArray[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
			expect( logMessageAsArray[ 1 ].includes( 'Merge pull request #75 from ckeditor/t/64' ) ).to.equal( true );
		} );

		it( 'allows hiding the logs', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: false } );

			expect( loggerVerbosity ).to.equal( 'error' );
		} );

		it( 'removes references to issues', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: [],
				references: [
					{ issue: '11' },
					{ issue: '12' }
				]
			};

			transformCommitForSubRepository( commit, { displayLogs: false } );

			expect( commit.references ).to.equal( undefined );
		} );

		it( 'uses commit\'s footer as a commit\'s body when commit does not have additional notes', () => {
			const commit = {
				hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
				header: 'Feature: Introduced a brand new release tools with a new set of requirements.',
				type: 'Feature',
				subject: 'Introduced a brand new release tools with a new set of requirements.',
				body: null,
				footer: 'Additional description has been parsed as a footer but it should be a body.',
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: false, packageData: packageJson } );

			expect( commit.body ).to.equal(
				'  Additional description has been parsed as a footer but it should be a body.'
			);
			expect( commit.footer ).to.equal( null );
		} );

		it( 'fixes the commit which does not contain the second line', () => {
			const commit = {
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

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( commit.hash ).to.equal( '575e00b' );
			expect( commit.header ).to.equal( 'Merge branch \'master\' of github.com:ckeditor/ckeditor5-dev' );
			expect( commit.body ).to.equal( null );
		} );

		it( 'displays proper log if commit does not contain the second line', () => {
			const commit = {
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

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			// The merge commit displays two lines:
			// Prefix: Changes.
			// Merge ...
			// If the merge commit does not contain the second line, it should display only the one.
			expect( stubs.logger.info.firstCall.args[ 0 ].split( '\n' ) ).length( 1 );
		} );

		it( 'allows returning invalid commit instead of removing', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Docs: README.',
				type: 'Docs',
				subject: 'README.',
				body: null,
				footer: null,
				notes: []
			};

			const newCommit = transformCommitForSubRepository( commit, {
				displayLogs: false,
				packageData: packageJson,
				returnInvalidCommit: true
			} );

			expect( newCommit ).to.deep.equal( commit );
		} );

		it( 'removes [skip ci] from the commit message', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: README. [skip ci]',
				type: 'Fix',
				subject: 'README. [skip ci]',
				body: null,
				footer: null,
				notes: []
			};

			transformCommitForSubRepository( commit, {
				displayLogs: false,
				packageData: packageJson,
				returnInvalidCommit: true
			} );

			expect( commit.subject ).to.equal( 'README.' );
		} );
	} );
} );
