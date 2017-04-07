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

describe( 'dev-env/release-tools/utils', () => {
	describe( 'transformCommitForCKEditor5DevPackage()', () => {
		let transformCommitForCKEditor5DevPackage, sandbox, stubs, context;

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
				transformCommitForCKEditor5Package: sandbox.stub(),
				getChangedFilesForCommit: sandbox.stub()
			};

			context = {
				packageData: {
					name: '@ckeditor/ckeditor5-dev-env'
				}
			};

			mockery.registerMock( './transformcommitforckeditor5package', stubs.transformCommitForCKEditor5Package );
			mockery.registerMock( './getchangedfilesforcommit', stubs.getChangedFilesForCommit );

			const functionPath = '../../../lib/release-tools/utils/transformcommitforckeditor5devpackage';
			transformCommitForCKEditor5DevPackage = proxyquire( functionPath, {
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

			expect( transformCommitForCKEditor5DevPackage( commit, context ) ).to.equal( undefined );
			expect( stubs.transformCommitForCKEditor5Package.called ).to.equal( false );
		} );

		it( 'rejects the commit when it has changed files in other packages', () => {
			const commit = {
				hash: 'abcd123'
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'packages/ckeditor5-dev-tests/README.md'
			] );

			expect( transformCommitForCKEditor5DevPackage( commit, context ) ).to.equal( undefined );
			expect( stubs.transformCommitForCKEditor5Package.called ).to.equal( false );
		} );

		it( 'rejects the commit when it has changed files in root of the repository', () => {
			const commit = {
				hash: 'abcd123'
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'README.md'
			] );

			expect( transformCommitForCKEditor5DevPackage( commit, context ) ).to.equal( undefined );
			expect( stubs.transformCommitForCKEditor5Package.called ).to.equal( false );
		} );

		it( 'accepts the commit when it has changed files for proper package', () => {
			const commit = {
				hash: 'abcd123'
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'packages/ckeditor5-dev-env/package.json',
			] );

			stubs.transformCommitForCKEditor5Package.returnsArg( 0 );

			expect( transformCommitForCKEditor5DevPackage( commit, context ) ).to.equal( commit );
			expect( stubs.transformCommitForCKEditor5Package.calledOnce ).to.equal( true );
		} );
	} );
} );
