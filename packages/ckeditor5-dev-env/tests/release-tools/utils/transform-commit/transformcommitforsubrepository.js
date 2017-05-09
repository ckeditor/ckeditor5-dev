/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

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

			transformCommitForSubRepository = proxyquire( '../../../../lib/release-tools/utils/transform-commit/transformcommitforsubrepository', {
				'@ckeditor/ckeditor5-dev-utils': {
					logger( verbosity ) {
						loggerVerbosity = verbosity;

						return stubs.logger;
					}
				}
			} );
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
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* \u001b\[33m684997d\u001b\[39m "Fix: Simple fix\." \u001b\[32mINCLUDED/ );
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
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* \u001b\[33m684997d\u001b\[39m "Docs: README\." \u001b\[90mSKIPPED/ );
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
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* \u001b\[33m684997d\u001b\[39m "Invalid commit\." \u001b\[31mINVALID/ );
		} );

		it( 'makes URLs to issues on GitHub', () => {
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
						text: 'Some issue #1.'
					}
				]
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			const expectedSubject = 'Simple fix. Closes [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2)';
			expect( commit.subject ).to.equal( expectedSubject );
			expect( commit.notes[ 0 ].text ).to.equal( 'Some issue [#1](https://github.com/ckeditor/ckeditor5-dev/issues/1).' );
		} );

		it( 'makes URLs to organization on GitHub', () => {
			const commit = {
				hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
				header: 'Internal: Thanks to @CKEditor',
				type: 'Fix',
				subject: 'Internal: Thanks to @CKEditor',
				body: null,
				footer: null,
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			const expectedSubject = 'Internal: Thanks to [@CKEditor](https://github.com/CKEditor)';
			expect( commit.subject ).to.equal( expectedSubject );
		} );

		it( 'makes URLs to issues in additional commit description', () => {
			const commitDescription = [
				'* See more in #1 and #2.'
			];

			const commitDescriptionWithIndents = [
				'  * See more in [#1](https://github.com/ckeditor/ckeditor5-dev/issues/1) and ' +
				'[#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).'
			].join( '\n' );

			const commit = {
				header: 'Other: Some improvements.',
				hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
				body: commitDescription.join( '\n' ),
				footer: null,
				mentions: [],
				type: 'Other',
				subject: 'Some improvements.',
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( commit.body ).to.equal( commitDescriptionWithIndents );
		} );

		it( 'makes URLs to organization in additional commit description', () => {
			const commitDescription = [
				'* Thanks to @CKSource and @CKEditor.'
			];

			const commitDescriptionWithIndents = [
				'  * Thanks to [@CKSource](https://github.com/CKSource) and [@CKEditor](https://github.com/CKEditor).'
			].join( '\n' );

			const commit = {
				header: 'Other: Some improvements.',
				hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
				body: commitDescription.join( '\n' ),
				footer: null,
				mentions: [],
				type: 'Other',
				subject: 'Some improvements.',
				notes: []
			};

			transformCommitForSubRepository( commit, { displayLogs: true, packageData: packageJson } );

			expect( commit.body ).to.equal( commitDescriptionWithIndents );
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

			const regexpMsg = /Feature: Introduced a brand new release tools with a new set of requirements. See #64./;
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( regexpMsg );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\u001b\[32mINCLUDED/ );
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
			//jscs:disable maximumLineLength
			const commitDetailsPattern = /\* \u001b\[33mdea3501\u001b\[39m "Feature: Introduced a brand new release tools with a new set of requirements\." \u001b\[32mINCLUDED/;
			//jscs:enable maximumLineLength
			const mergeCommitPattern = /Merge pull request #75 from ckeditor\/t\/64/;

			expect( logMessageAsArray.length ).to.equal( 2 );
			expect( logMessageAsArray[ 0 ] ).to.match( commitDetailsPattern );
			expect( logMessageAsArray[ 1 ] ).to.match( mergeCommitPattern );
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

			expect( commit.body ).to.equal( '  Additional description has been parsed as a footer but it should be a body.' );
			expect( commit.footer ).to.equal( null );
		} );
	} );
} );
