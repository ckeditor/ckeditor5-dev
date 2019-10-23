/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const transformCommitFactory = require( '../../../lib/release-tools/utils/transform-commit/transformcommitforsubrepositoryfactory' );

describe( 'dev-env/release-tools/utils', () => {
	let displayCommits, transformCommit, sandbox, stubs;

	beforeEach( () => {
		transformCommit = transformCommitFactory( {
			returnInvalidCommit: true
		} );
		sandbox = sinon.createSandbox();

		stubs = {
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			}
		};

		displayCommits = proxyquire( '../../../lib/release-tools/utils/displaycommits', {
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

	describe( 'displayCommits()', () => {
		it( 'prints if there is no commit to display', () => {
			displayCommits( [] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).includes( 'No commits to display.' );
		} );

		it( 'attaches valid "external" commit to the changelog (as Array)', () => {
			const rawCommit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: []
			};

			const commit = transformCommit( rawCommit );

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Fix: Simple fix.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'attaches valid "external" commit to the changelog (as Set)', () => {
			const rawCommit = {
				hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
				header: 'Fix: Simple fix.',
				type: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: []
			};

			const commit = transformCommit( rawCommit );

			displayCommits( new Set( [ commit ] ) );

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

			const commit = transformCommit( rawCommit );

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

			const commit = transformCommit( rawCommit, { returnInvalidCommit: true } );

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

			const commit = transformCommit( rawCommit, { returnInvalidCommit: true } );

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

			const commit = transformCommit( rawCommit );

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

			const commit = transformCommit( rawCommit, { returnInvalidCommit: true } );

			displayCommits( [ commit ] );

			// The merge commit displays two lines:
			// Prefix: Changes.
			// Merge ...
			// If the merge commit does not contain the second line, it should display only the one.
			expect( stubs.logger.info.firstCall.args[ 0 ].split( '\n' ) ).length( 1 );
		} );

		describe( 'options.attachLinkToCommit', () => {
			it( 'adds a link to displayed commit', () => {
				const commit = {
					hash: '684997d',
					header: 'Fix: Simple fix.',
					type: 'Bug fixes',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes: [],
					rawType: 'Fix',
					repositoryUrl: 'https://github.com/ckeditor/ckeditor5-foo'
				};

				displayCommits( [ commit ], { attachLinkToCommit: true } );

				expect( stubs.logger.info.calledOnce ).to.equal( true );

				const logMessage = stubs.logger.info.firstCall.args[ 0 ].split( '\n' );

				expect( logMessage[ 0 ].includes( 'Fix: Simple fix.' ) ).to.equal( true );
				expect( logMessage[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
				expect( logMessage[ 1 ].includes( 'https://github.com/ckeditor/ckeditor5-foo/commit/684997d' ) ).to.equal( true );
			} );
		} );

		describe( 'options.indentLevel', () => {
			it( 'is equal to 1 by default', () => {
				const commit = {
					hash: '684997d',
					header: 'Fix: Simple fix.',
					type: 'Bug fixes',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes: [],
					rawType: 'Fix'
				};

				displayCommits( [ commit ] );

				expect( stubs.logger.info.calledOnce ).to.equal( true );

				const logMessage = stubs.logger.info.firstCall.args[ 0 ];

				expect( logMessage.substring( 0, 3 ) ).to.equal( '   ' );
			} );

			it( 'indents second line properly', () => {
				const commit = {
					hash: '684997d',
					merge: 'Merge pull request #75 from ckeditor/t/64',
					header: 'Feature: Introduced a brand new release tools with a new set of requirements.',
					type: 'Feature',
					subject: 'Introduced a brand new release tools with a new set of requirements.',
					body: null,
					footer: null,
					notes: [],
					rawType: 'Fix'
				};

				displayCommits( [ commit ] );

				expect( stubs.logger.info.calledOnce ).to.equal( true );

				const [ firstLine, secondLine ] = stubs.logger.info.firstCall.args[ 0 ].split( '\n' );

				expect( firstLine.substring( 0, 3 ) ).to.equal( ' '.repeat( 3 ) );
				expect( secondLine.substring( 0, 13 ) ).to.equal( ' '.repeat( 13 ) );
			} );

			it( 'works with "options.attachLinkToCommit"', () => {
				const commit = {
					hash: '684997d',
					merge: 'Merge pull request #75 from ckeditor/t/64',
					header: 'Feature: Introduced a brand new release tools with a new set of requirements.',
					type: 'Feature',
					subject: 'Introduced a brand new release tools with a new set of requirements.',
					body: null,
					footer: null,
					notes: [],
					rawType: 'Fix',
					repositoryUrl: 'https://github.com/ckeditor/ckeditor5-foo'
				};

				displayCommits( [ commit ], { attachLinkToCommit: true, indentLevel: 2 } );

				expect( stubs.logger.info.calledOnce ).to.equal( true );

				const [ firstLine, secondLine, thirdLine ] = stubs.logger.info.firstCall.args[ 0 ].split( '\n' );

				expect( firstLine.substring( 0, 6 ) ).to.equal( ' '.repeat( 6 ) );
				expect( secondLine.substring( 0, 16 ) ).to.equal( ' '.repeat( 16 ) );
				expect( thirdLine.substring( 0, 16 ) ).to.equal( ' '.repeat( 16 ) );
			} );
		} );
	} );
} );
