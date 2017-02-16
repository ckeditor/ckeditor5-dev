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

describe( 'dev-env/release-tools/changelog/writer-options', () => {
	describe( 'transform()', () => {
		let transformCommit, sandbox, stubs;

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
				chalk: {
					red: sandbox.stub().returnsArg( 0 ),
					grey: sandbox.stub().returnsArg( 0 ),
					green: sandbox.stub().returnsArg( 0 )
				}
			};

			mockery.registerMock( 'chalk', stubs.chalk );

			transformCommit = proxyquire( '../../../lib/release-tools/changelog/writer-options', {
				'@ckeditor/ckeditor5-dev-utils': {
					logger() {
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
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* 684997d "Fix: Simple fix\." INCLUDED/ );
			expect( stubs.chalk.green.calledOnce ).to.equal( true );
			expect( stubs.chalk.green.firstCall.args[ 0 ] ).to.equal( 'INCLUDED' );
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
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* 684997d "Docs: README\." SKIPPED/ );
			expect( stubs.chalk.grey.calledOnce ).to.equal( true );
			expect( stubs.chalk.grey.firstCall.args[ 0 ] ).to.equal( 'SKIPPED' );
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
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /\* 684997d "Invalid commit\." INVALID/ );
			expect( stubs.chalk.red.calledOnce ).to.equal( true );
			expect( stubs.chalk.red.firstCall.args[ 0 ] ).to.equal( 'INVALID' );
		} );
	} );
} );
