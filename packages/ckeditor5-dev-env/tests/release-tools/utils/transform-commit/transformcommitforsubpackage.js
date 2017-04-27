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
	describe( 'transformCommitForSubPackage()', () => {
		let transformCommitForSubPackage, sandbox, stubs, context;

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
				transformCommitForSubRepository: sandbox.stub(),
				getChangedFilesForCommit: sandbox.stub()
			};

			context = {
				packageData: {
					name: '@ckeditor/ckeditor5-dev-env'
				}
			};

			mockery.registerMock( './transformcommitforsubrepository', stubs.transformCommitForSubRepository );
			mockery.registerMock( './getchangedfilesforcommit', stubs.getChangedFilesForCommit );

			const functionPath = '../../../../lib/release-tools/utils/transform-commit/transformcommitforsubpackage';
			transformCommitForSubPackage = proxyquire( functionPath, {
				'@ckeditor/ckeditor5-dev-utils': {
					logger() {
						return stubs.logger;
					}
				}
			} );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'rejects the commit if no files were changed', () => {
			const commit = {
				hash: 'abcd123'
			};

			stubs.getChangedFilesForCommit.returns( [] );

			expect( transformCommitForSubPackage( commit, context ) ).to.equal( undefined );
			expect( stubs.transformCommitForSubRepository.called ).to.equal( false );
		} );

		it( 'rejects the commit when it changed files in other package', () => {
			const commit = {
				hash: 'abcd123'
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-tests/CHANGELOG.md',
				'packages/ckeditor5-dev-tests/README.md'
			] );

			expect( transformCommitForSubPackage( commit, context ) ).to.equal( undefined );
			expect( stubs.transformCommitForSubRepository.called ).to.equal( false );
		} );

		it( 'accepts the commit when it has changed files in proper and other packages', () => {
			const commit = {
				hash: 'abcd123'
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'packages/ckeditor5-dev-tests/README.md'
			] );

			stubs.transformCommitForSubRepository.returnsArg( 0 );

			expect( transformCommitForSubPackage( commit, context ) ).to.equal( commit );
			expect( stubs.transformCommitForSubRepository.called ).to.equal( true );
		} );

		it( 'accepts the commit when it has changed files in proper packages and root of the repository', () => {
			const commit = {
				hash: 'abcd123'
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'README.md'
			] );

			stubs.transformCommitForSubRepository.returnsArg( 0 );

			expect( transformCommitForSubPackage( commit, context ) ).to.equal( commit );
			expect( stubs.transformCommitForSubRepository.called ).to.equal( true );
		} );

		it( 'accepts the commit when it has changed files for proper package', () => {
			const commit = {
				hash: 'abcd123'
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'packages/ckeditor5-dev-env/package.json',
			] );

			stubs.transformCommitForSubRepository.returnsArg( 0 );

			expect( transformCommitForSubPackage( commit, context ) ).to.equal( commit );
			expect( stubs.transformCommitForSubRepository.calledOnce ).to.equal( true );
		} );
	} );
} );
