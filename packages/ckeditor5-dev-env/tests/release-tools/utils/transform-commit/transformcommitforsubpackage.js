/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
			sandbox = sinon.createSandbox();

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

			stubs.transformCommitForSubRepository.returnsArg( 0 );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'rejects the commit if no files were changed', () => {
			const commit = {
				hash: 'abcd123',
				notes: []
			};

			stubs.getChangedFilesForCommit.returns( [] );

			expect( transformCommitForSubPackage( commit, context ) ).to.equal( undefined );
			expect( stubs.transformCommitForSubRepository.called ).to.equal( false );
		} );

		it( 'rejects the commit when it changed files in other package', () => {
			const commit = {
				hash: 'abcd123',
				notes: []
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

		it( 'returns a new instance of object instead od modifying passed one', () => {
			const notes = [
				{ title: 'Foo', text: 'Foo-Text' },
				{ title: 'Bar', text: 'Bar-Text' }
			];

			const rawCommit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'packages/ckeditor5-dev-env/package.json',
			] );

			stubs.transformCommitForSubRepository.reset();
			stubs.transformCommitForSubRepository.callsFake( commit => {
				commit.hash = commit.hash.substring( 0, 7 );

				return commit;
			} );

			const commit = transformCommitForSubPackage( rawCommit, context );

			expect( stubs.transformCommitForSubRepository.calledOnce ).to.equal( true );

			// `transformCommitForSubRepository` modifies `hash` of given commit and returns the same object.
			// `transformCommitForSubPackage` must care about cloning the object before any operation.
			expect( commit.hash ).to.not.equal( rawCommit.hash );

			// Notes cannot be the same but they should be equal.
			expect( commit.notes ).to.not.equal( rawCommit.notes );
			expect( commit.notes ).to.deep.equal( rawCommit.notes );
		} );

		it( 'accepts the commit when it has changed files in proper and other packages', () => {
			const rawCommit = {
				hash: 'abcd123',
				notes: []
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'packages/ckeditor5-dev-tests/README.md'
			] );

			const commit = transformCommitForSubPackage( rawCommit, context );

			expect( stubs.transformCommitForSubRepository.called ).to.equal( true );
			expect( commit ).to.deep.equal( rawCommit );
		} );

		it( 'accepts the commit when it has changed files in proper packages and root of the repository', () => {
			const rawCommit = {
				hash: 'abcd123',
				notes: []
			};

			stubs.getChangedFilesForCommit.returns( [
				'README.md',
				'packages/ckeditor5-dev-env/README.md'
			] );

			const commit = transformCommitForSubPackage( rawCommit, context );

			expect( stubs.transformCommitForSubRepository.called ).to.equal( true );
			expect( commit ).to.deep.equal( rawCommit );
		} );

		it( 'accepts the commit when it has changed files for proper package', () => {
			const rawCommit = {
				hash: 'abcd123',
				notes: []
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/ckeditor5-dev-env/README.md',
				'packages/ckeditor5-dev-env/package.json',
			] );

			const commit = transformCommitForSubPackage( rawCommit, context );

			expect( stubs.transformCommitForSubRepository.called ).to.equal( true );
			expect( commit ).to.deep.equal( rawCommit );
		} );

		it( 'does not crash if the merge commit does not contain the second line', () => {
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

			stubs.getChangedFilesForCommit.returns( [] );

			expect( () => {
				transformCommitForSubPackage( rawCommit, context );
			} ).to.not.throw( Error );
		} );

		it( 'works for packages without scoped name', () => {
			context = {
				packageData: {
					name: 'eslint-config-ckeditor5'
				}
			};

			const rawCommit = {
				hash: 'abcd123',
				notes: []
			};

			stubs.getChangedFilesForCommit.returns( [
				'packages/eslint-config-ckeditor5/README.md'
			] );

			const commit = transformCommitForSubPackage( rawCommit, context );

			expect( stubs.transformCommitForSubRepository.called ).to.equal( true );
			expect( commit ).to.deep.equal( rawCommit );
		} );
	} );
} );
