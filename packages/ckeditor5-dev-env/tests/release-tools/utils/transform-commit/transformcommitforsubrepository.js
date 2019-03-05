/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils/transform-commit', () => {
	describe( 'transformCommitForSubRepository()', () => {
		let transformCommitForSubRepository, sandbox;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			transformCommitForSubRepository = require(
				'../../../../lib/release-tools/utils/transform-commit/transformcommitforsubrepository'
			);
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
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

			const commit = transformCommitForSubRepository( rawCommit );

			// `transformCommit` modifies `hash` of given commit.
			expect( commit.hash ).to.not.equal( rawCommit.hash );

			// Notes cannot be the same but they should be equal.
			expect( commit.notes ).to.not.equal( rawCommit.notes );
			expect( commit.notes ).to.deep.equal( rawCommit.notes );
		} );

		it( 'returns "undefined" if given commit should not be visible in the changelog', () => {
			const rawCommit = {
				hash: '684997d',
				header: 'Docs: README.',
				type: 'Docs',
				subject: 'README.',
				body: null,
				footer: null,
				notes: []
			};

			const newCommit = transformCommitForSubRepository( rawCommit );

			expect( newCommit ).to.equal( undefined );
		} );

		it( 'allows returning invalid commit instead of removing', () => {
			const rawCommit = {
				hash: '684997d',
				header: 'Docs: README.',
				type: 'Docs',
				subject: 'README.',
				body: null,
				footer: null,
				notes: []
			};

			const newCommit = transformCommitForSubRepository( rawCommit, { returnInvalidCommit: true } );

			expect( newCommit ).to.not.equal( undefined );
		} );

		it( 'groups "BREAKING CHANGES" and "BREAKING CHANGE" as a single group', () => {
			const rawCommit = {
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

			const commit = transformCommitForSubRepository( rawCommit );

			expect( commit.notes[ 0 ].title ).to.equal( 'BREAKING CHANGES' );
			expect( commit.notes[ 1 ].title ).to.equal( 'BREAKING CHANGES' );
		} );

		it( 'makes proper links in the commit subject', () => {
			const rawCommit = {
				hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
				header: 'Fix: Simple fix. See ckeditor/ckeditor5#1. Thanks to @CKEditor. Closes #2.',
				type: 'Fix',
				subject: 'Simple fix. See ckeditor/ckeditor5#1. Thanks to @CKEditor. Closes #2.',
				body: null,
				footer: null,
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit );

			const expectedSubject = 'Simple fix. ' +
				'See [ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1). ' +
				'Thanks to [@CKEditor](https://github.com/CKEditor). ' +
				'Closes [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).';

			expect( commit.subject ).to.equal( expectedSubject );
		} );

		it( 'makes proper links in the commit body', () => {
			const rawCommit = {
				hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
				header: 'Fix: Simple fix. Closes #2.',
				type: 'Fix',
				subject: 'Simple fix. Closes #2',
				body: 'See ckeditor/ckeditor5#1. Thanks to @CKEditor. Read more #2.',
				footer: null,
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit );

			// Remember about the indent in commit body.
			const expectedBody = '  See [ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1). ' +
				'Thanks to [@CKEditor](https://github.com/CKEditor). ' +
				'Read more [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).';

			expect( commit.body ).to.equal( expectedBody );
		} );

		it( 'makes proper links in the commit notes', () => {
			const rawCommit = {
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

			const commit = transformCommitForSubRepository( rawCommit );

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

			const rawCommit = {
				header: 'Feature: Introduced a brand new release tools with a new set of requirements. See #64.',
				hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
				body: commitDescription.join( '\n' ),
				footer: null,
				mentions: [],
				type: 'Feature',
				subject: 'Introduced a brand new release tools with a new set of requirements. See #64.',
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit );

			expect( commit.type ).to.equal( 'Features' );
			expect( commit.subject ).to.equal( 'Introduced a brand new release tools with a new set of requirements. ' +
				'See [#64](https://github.com/ckeditor/ckeditor5-dev/issues/64).' );
			expect( commit.body ).to.equal( commitDescriptionWithIndents );
		} );

		it( 'removes references to issues', () => {
			const rawCommit = {
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

			const commit = transformCommitForSubRepository( rawCommit, { displayLogs: false } );

			expect( commit.references ).to.equal( undefined );
		} );

		it( 'uses commit\'s footer as a commit\'s body when commit does not have additional notes', () => {
			const rawCommit = {
				hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
				header: 'Feature: Introduced a brand new release tools with a new set of requirements.',
				type: 'Feature',
				subject: 'Introduced a brand new release tools with a new set of requirements.',
				body: null,
				footer: 'Additional description has been parsed as a footer but it should be a body.',
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit, { displayLogs: false } );

			expect( commit.body ).to.equal(
				'  Additional description has been parsed as a footer but it should be a body.'
			);
			expect( commit.footer ).to.equal( null );
		} );

		it( 'fixes the commit which does not contain the second line', () => {
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

			expect( commit.hash ).to.equal( '575e00b' );
			expect( commit.header ).to.equal( 'Merge branch \'master\' of github.com:ckeditor/ckeditor5-dev' );
			expect( commit.body ).to.equal( null );
		} );

		it( 'removes [skip ci] from the commit message', () => {
			const rawCommit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: README. [skip ci]',
				type: 'Fix',
				subject: 'README. [skip ci]',
				body: null,
				footer: null,
				notes: []
			};

			const commit = transformCommitForSubRepository( rawCommit );

			expect( commit.subject ).to.equal( 'README.' );
		} );
	} );
} );
