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
const getPackageJson = require( '../../../lib/release-tools/utils/getpackagejson' );

describe( 'dev-env/release-tools/changelog/writer-options', () => {
	describe( 'transform()', () => {
		let transformCommit, sandbox, stubs, loggerVerbosity;

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
				},
				getPackageJson: sandbox.spy( () => {
					return getPackageJson();
				} )
			};

			mockery.registerMock( '../utils/getpackagejson', stubs.getPackageJson );

			transformCommit = proxyquire( '../../../lib/release-tools/changelog/writer-options', {
				'@ckeditor/ckeditor5-dev-utils': {
					logger( verbosity ) {
						loggerVerbosity = verbosity;

						return stubs.logger;
					}
				}
			} ).transform;
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
				],
				references: []
			};

			transformCommit( commit );

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
				notes: [],
				references: []
			};

			transformCommit( commit );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* 684997d "Fix: Simple fix\." \u001b\[32mINCLUDED/ );
		} );

		it( 'does not attach valid "internal" commit to the changelog', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Docs: README.',
				type: 'Docs',
				subject: 'README.',
				body: null,
				footer: null,
				notes: [],
				references: []
			};

			transformCommit( commit );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* 684997d "Docs: README\." \u001b\[90mSKIPPED/ );
		} );

		it( 'does not attach invalid commit to the changelog', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Invalid commit.',
				type: null,
				subject: null,
				body: null,
				footer: null,
				notes: [],
				references: []
			};

			transformCommit( commit );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* 684997d "Invalid commit\." \u001b\[31mINVALID/ );
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
				],
				references: []
			};

			transformCommit( commit );

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
				notes: [],
				references: []
			};

			transformCommit( commit );

			const expectedSubject = 'Internal: Thanks to [@CKEditor](https://github.com/CKEditor)';
			expect( commit.subject ).to.equal( expectedSubject );
		} );

		it( 'should load package.json once', () => {
			const commits = [
				{
					hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
					header: 'Fix: Simple fix (first). Closes #2.',
					type: 'Fix',
					subject: 'Simple fix (first). Closes #2',
					body: null,
					footer: null,
					notes: [],
					references: []
				},
				{
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix (second). Closes #1.',
					type: 'Fix',
					subject: 'Simple fix (second). Closes #1',
					body: null,
					footer: null,
					notes: [],
					references: []
				}
			];

			transformCommit( commits[ 0 ] );
			transformCommit( commits[ 1 ] );

			expect( stubs.getPackageJson.calledOnce ).to.equal( true );
		} );

		it( 'allows hiding the logs', () => {
			const commit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: [],
				references: []
			};

			transformCommit( commit, false );

			expect( loggerVerbosity ).to.equal( 'error' );
		} );
	} );
} );
