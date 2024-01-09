/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-release-tools/utils', () => {
	let displayCommits, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		stubs = {
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			}
		};

		displayCommits = proxyquire( '../../lib/utils/displaycommits', {
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
			const commit = {
				hash: '684997d',
				header: 'Fix: Simple fix.',
				type: 'Bug fixes',
				rawType: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: []
			};

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Fix: Simple fix.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'attaches valid "external" commit to the changelog (as Set)', () => {
			const commit = {
				hash: '684997d',
				header: 'Fix: Simple fix.',
				type: 'Bug fixes',
				rawType: 'Fix',
				subject: 'Simple fix.',
				body: null,
				footer: null,
				notes: []
			};

			displayCommits( new Set( [ commit ] ) );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Fix: Simple fix.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'truncates too long commit\'s subject', () => {
			const commit = {
				hash: '684997d',
				header: 'Fix: Reference site about Lorem Ipsum, giving information on its origins, as well as ' +
					'a random Lipsum generator.',
				type: 'Bug fixes',
				rawType: 'Fix',
				subject: 'Reference site about Lorem Ipsum, giving information on its origins, as well as ' +
					'a random Lipsum generator.',
				body: null,
				footer: null,
				notes: []
			};

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes(
				'Fix: Reference site about Lorem Ipsum, giving information on its origins, as well as a random Lip...'
			) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INCLUDED' ) ).to.equal( true );
		} );

		it( 'does not attach valid "internal" commit to the changelog', () => {
			const commit = {
				hash: '684997d',
				header: 'Docs: README.',
				type: 'Docs',
				rawType: 'Docs',
				subject: 'README.',
				body: null,
				footer: null,
				notes: []
			};

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Docs: README.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'SKIPPED' ) ).to.equal( true );
		} );

		it( 'does not attach invalid commit to the changelog', () => {
			const commit = {
				hash: '684997d',
				header: 'Invalid commit.',
				type: null,
				subject: null,
				body: null,
				footer: null,
				notes: []
			};

			displayCommits( [ commit ] );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'Invalid commit.' ) ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ].includes( 'INVALID' ) ).to.equal( true );
		} );

		it( 'attaches additional subject for merge commits to the commit list', () => {
			const commit = {
				merge: 'Merge pull request #75 from ckeditor/t/64',
				hash: 'dea3501',
				header: 'Feature: Introduced a brand new release tools with a new set of requirements.',
				type: 'Feature',
				rawType: 'Feature',
				subject: 'Introduced a brand new release tools with a new set of requirements.',
				body: null,
				footer: null,
				mentions: [],
				notes: []
			};

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
			const commit = {
				type: null,
				subject: null,
				merge: 'Merge branch \'master\' of github.com:ckeditor/ckeditor5-dev',
				header: 'Merge branch \'master\' of github.com:ckeditor/ckeditor5-dev',
				body: null,
				footer: null,
				notes: [],
				references: [],
				mentions: [],
				revert: null,
				rawType: undefined,
				files: [],
				scope: undefined,
				isPublicCommit: false,
				hash: 'a'.repeat( 40 ),
				repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
			};

			displayCommits( [ commit ] );

			// The merge commit displays two lines:
			// Prefix: Changes.
			// Merge ...
			// If the merge commit does not contain the second line, it should display only the one.
			expect( stubs.logger.info.firstCall.args[ 0 ].split( '\n' ) ).length( 1 );
		} );

		it( 'attaches breaking changes notes to displayed message', () => {
			const commit = {
				hash: '684997d',
				header: 'Feature: Simple foo.',
				type: 'Feature',
				rawType: 'Feature',
				subject: 'Simple foo.',
				body: null,
				footer: null,
				notes: [
					{
						title: 'MAJOR BREAKING CHANGES',
						text: '1 - Reference site about Lorem Ipsum, giving information on its origins, as well as ' +
							'a random Lipsum generator.'
					},
					{
						title: 'MAJOR BREAKING CHANGES',
						text: '2 - Reference site about Lorem Ipsum, giving information on its origins, as well as ' +
							'a random Lipsum generator.'
					},
					{
						title: 'MINOR BREAKING CHANGES',
						text: '3 - Reference site about Lorem Ipsum, giving information on its origins, as well as ' +
							'a random Lipsum generator.'
					}
				]
			};

			displayCommits( [ commit ] );

			const message = stubs.logger.info.firstCall.args[ 0 ].split( '\n' );

			/* eslint-disable max-len */
			expect( message[ 0 ].includes( 'Feature: Simple foo.' ) ).to.equal( true );
			expect( message[ 1 ].includes( 'MAJOR BREAKING CHANGES: 1 - Reference site about Lorem Ipsum, giving information on its origins, as...' ) ).to.equal( true );
			expect( message[ 2 ].includes( 'MAJOR BREAKING CHANGES: 2 - Reference site about Lorem Ipsum, giving information on its origins, as...' ) ).to.equal( true );
			expect( message[ 3 ].includes( 'MINOR BREAKING CHANGES: 3 - Reference site about Lorem Ipsum, giving information on its origins, as...' ) ).to.equal( true );
			/* eslint-enable max-len */
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

		describe( 'grouping commits', () => {
			it( 'works for a group of two commits between single commit groups', () => {
				// Displayed log:
				//
				//  * aaaaaaa "Fix: Another fix." INCLUDED
				// ---------------------------------------------
				// |* bbbbbbb "Fix: Simple fix." INCLUDED
				// |* bbbbbbb "Feature: A new feature." INCLUDED
				// ---------------------------------------------
				//  * ccccccc "Fix: Another fix." INCLUDED

				displayCommits( [
					{
						hash: 'a'.repeat( 40 ),
						header: 'Fix: Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Another fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'b'.repeat( 40 ),
						header: 'Fix: Simple fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'b'.repeat( 40 ),
						header: 'Feature: A new feature.',
						type: 'Features',
						rawType: 'Feature',
						subject: 'A new feature.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'c'.repeat( 40 ),
						header: 'Fix: Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Another fix.',
						body: null,
						footer: null,
						notes: []
					}
				] );

				// Calls: 0, 2, 3, and 5 display the commit data.
				expect( stubs.logger.info.callCount ).to.equal( 6 );
				expect( stubs.logger.info.getCall( 1 ).args[ 0 ] ).to.match( /-----/ );
				expect( stubs.logger.info.getCall( 4 ).args[ 0 ] ).to.match( /-----/ );
			} );

			it( 'works for a group of two commits that follows a single commit group', () => {
				// Displayed log:
				//
				//  * aaaaaaa "Fix: Another fix." INCLUDED
				// ---------------------------------------------
				// |* bbbbbbb "Fix: Simple fix." INCLUDED
				// |* bbbbbbb "Feature: A new feature." INCLUDED
				// ---------------------------------------------
				displayCommits( [
					{
						hash: 'a'.repeat( 40 ),
						header: 'Fix: Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Another fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'b'.repeat( 40 ),
						header: 'Fix: Simple fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'b'.repeat( 40 ),
						header: 'Feature: A new feature.',
						type: 'Features',
						rawType: 'Feature',
						subject: 'A new feature.',
						body: null,
						footer: null,
						notes: []
					}
				] );

				// Calls: 0, 2, and 3  display the commit data.
				expect( stubs.logger.info.callCount ).to.equal( 5 );
				expect( stubs.logger.info.getCall( 1 ).args[ 0 ] ).to.match( /-----/ );
				expect( stubs.logger.info.getCall( 4 ).args[ 0 ] ).to.match( /-----/ );
			} );

			it( 'works for a single commit group that follows group of two commits ', () => {
				// Displayed log:
				//
				// ---------------------------------------------
				// |* bbbbbbb "Fix: Simple fix." INCLUDED
				// |* bbbbbbb "Feature: A new feature." INCLUDED
				// ---------------------------------------------
				//  * ccccccc "Fix: Another fix." INCLUDED

				displayCommits( [
					{
						hash: 'b'.repeat( 40 ),
						header: 'Fix: Simple fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'b'.repeat( 40 ),
						header: 'Feature: A new feature.',
						type: 'Features',
						rawType: 'Feature',
						subject: 'A new feature.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'c'.repeat( 40 ),
						header: 'Fix: Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Another fix.',
						body: null,
						footer: null,
						notes: []
					}
				] );

				// Calls: 1, 2, and 4 display the commit data.
				expect( stubs.logger.info.callCount ).to.equal( 5 );
				expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.match( /-----/ );
				expect( stubs.logger.info.getCall( 3 ).args[ 0 ] ).to.match( /-----/ );
			} );

			it( 'does not duplicate the separator for commit groups', () => {
				// Displayed log:
				//
				// ---------------------------------------------
				// |* bbbbbbb "Fix: Simple fix." INCLUDED
				// |* bbbbbbb "Feature: A new feature." INCLUDED
				// ---------------------------------------------
				// |* ccccccc "Fix: One Another fix." INCLUDED
				// |* ccccccc "Fix: Another fix." INCLUDED
				// ---------------------------------------------

				displayCommits( [
					{
						hash: 'b'.repeat( 40 ),
						header: 'Fix: Simple fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'b'.repeat( 40 ),
						header: 'Feature: A new feature.',
						type: 'Features',
						rawType: 'Feature',
						subject: 'A new feature.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'c'.repeat( 40 ),
						header: 'Fix: One Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'One Another fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'c'.repeat( 40 ),
						header: 'Fix: Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Another fix.',
						body: null,
						footer: null,
						notes: []
					}
				] );

				// Calls: 1, 2, 4, and 5 display the commit data.
				expect( stubs.logger.info.callCount ).to.equal( 7 );
				expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.match( /-----/ );
				expect( stubs.logger.info.getCall( 3 ).args[ 0 ] ).to.match( /-----/ );
				expect( stubs.logger.info.getCall( 4 ).args[ 0 ] ).to.not.match( /-----/ );
				expect( stubs.logger.info.getCall( 6 ).args[ 0 ] ).to.match( /-----/ );
			} );

			it( 'groups two groups of commits separated by a single commit group', () => {
				// Displayed log:
				//
				// ---------------------------------------------
				// |* bbbbbbb "Fix: Simple fix." INCLUDED
				// |* bbbbbbb "Feature: A new feature." INCLUDED
				// ---------------------------------------------
				//  * aaaaaaa "Fix: Another fix." INCLUDED
				// ---------------------------------------------
				// |* ccccccc "Fix: One Another fix." INCLUDED
				// |* ccccccc "Fix: Another fix." INCLUDED
				// ---------------------------------------------

				displayCommits( [
					{
						hash: 'b'.repeat( 40 ),
						header: 'Fix: Simple fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'b'.repeat( 40 ),
						header: 'Feature: A new feature.',
						type: 'Features',
						rawType: 'Feature',
						subject: 'A new feature.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'a'.repeat( 40 ),
						header: 'Fix: Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Another fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'c'.repeat( 40 ),
						header: 'Fix: One Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'One Another fix.',
						body: null,
						footer: null,
						notes: []
					},
					{
						hash: 'c'.repeat( 40 ),
						header: 'Fix: Another fix.',
						type: 'Bug fixes',
						rawType: 'Fix',
						subject: 'Another fix.',
						body: null,
						footer: null,
						notes: []
					}
				] );

				// Calls: 1, 2, 4, 6, and 7 display the commit data.
				expect( stubs.logger.info.callCount ).to.equal( 9 );
				expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.match( /-----/ );
				expect( stubs.logger.info.getCall( 3 ).args[ 0 ] ).to.match( /-----/ );

				expect( stubs.logger.info.getCall( 5 ).args[ 0 ] ).to.match( /-----/ );
				expect( stubs.logger.info.getCall( 8 ).args[ 0 ] ).to.match( /-----/ );
			} );
		} );
	} );
} );
