/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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

		it( 'rejects the "Publish" commit', () => {
			const commit = {
				type: null,
				subject: null,
				pullRequestId: null,
				merge: null,
				header: 'Publish',
				body: ' - @ckeditor/ckeditor5-dev-env@5.1.4\n' +
					' - ckeditor5-dev@0.0.22',
				footer: null,
				notes: [],
				references: [],
				mentions: [],
				revert: null,
				hash: '55a067502afcf26af25522b7a49b4245a16de16d'
			};

			expect( transformCommitForSubPackage( commit, context ) ).to.equal( undefined );
			expect( stubs.getChangedFilesForCommit.called ).to.equal( false );
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

		it( 'does not crash if the merge commit does not contain the second line', () => {
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

			stubs.getChangedFilesForCommit.returns( [] );

			expect( () => {
				transformCommitForSubPackage( commit, context );
			} ).to.not.throw( Error );

			expect( stubs.getChangedFilesForCommit.firstCall.args[ 0 ] ).to.equal( '575e00bc8ece48826adefe226c4fb1fe071c73a7' );
			expect( commit.hash ).to.equal( '575e00bc8ece48826adefe226c4fb1fe071c73a7' );
			expect( commit.header ).to.equal( 'Merge branch \'master\' of github.com:ckeditor/ckeditor5-dev' );
			expect( commit.body ).to.equal( null );
		} );
	} );
} );
