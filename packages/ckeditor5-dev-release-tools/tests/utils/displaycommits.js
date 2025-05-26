/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import displayCommits from '../../lib/utils/displaycommits.js';

const stubs = vi.hoisted( () => {
	const values = {
		logger: {
			info: vi.fn()
		},
		chalk: {
			bold: vi.fn( input => input ),
			italic: vi.fn( input => input ),
			underline: vi.fn( input => input ),
			gray: vi.fn( input => input ),
			green: vi.fn( input => input ),
			yellow: vi.fn( input => input ),
			red: vi.fn( input => input )
		}
	};

	// To make `chalk.bold.yellow.red()` working.
	for ( const rootKey of Object.keys( values.chalk ) ) {
		for ( const nestedKey of Object.keys( values.chalk ) ) {
			values.chalk[ rootKey ][ nestedKey ] = values.chalk[ nestedKey ];
		}
	}

	return values;
} );

vi.mock( 'chalk', () => ( {
	default: stubs.chalk
} ) );
vi.mock( '@ckeditor/ckeditor5-dev-utils', () => ( {
	logger: vi.fn( () => stubs.logger )
} ) );

describe( 'displayCommits()', () => {
	it( 'prints if there is no commit to display', () => {
		displayCommits( [] );

		expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;

		expect( firstArgument ).toContain( 'No commits to display.' );
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

		expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;

		expect( firstArgument ).toContain( 'Fix: Simple fix.' );
		expect( firstArgument ).toContain( 'INCLUDED' );
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

		expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;

		expect( firstArgument ).toContain( 'Fix: Simple fix.' );
		expect( firstArgument ).toContain( 'INCLUDED' );
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

		expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;

		expect( firstArgument ).toContain(
			'Fix: Reference site about Lorem Ipsum, giving information on its origins, as well as a random Lip...'
		);
		expect( firstArgument ).toContain( 'INCLUDED' );
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

		expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;

		expect( firstArgument ).toContain( 'Docs: README.' );
		expect( firstArgument ).toContain( 'SKIPPED' );
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

		expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;

		expect( firstArgument ).toContain( 'Invalid commit.' );
		expect( firstArgument ).toContain( 'INVALID' );
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

		expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;
		const logMessageAsArray = firstArgument.split( '\n' );

		expect( logMessageAsArray[ 0 ] ).toContain( 'Feature: Introduced a brand new release tools with a new set of requirements.' );
		expect( logMessageAsArray[ 0 ] ).toContain( 'INCLUDED' );
		expect( logMessageAsArray[ 1 ] ).toContain( 'Merge pull request #75 from ckeditor/t/64' );
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

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;

		// The merge commit displays two lines:
		// Prefix: Changes.
		// Merge ...
		// If the merge commit does not contain the second line, it should display only the one.
		expect( firstArgument.split( '\n' ) ).toHaveLength( 1 );
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

		const [ firstCall ] = stubs.logger.info.mock.calls;
		const [ firstArgument ] = firstCall;
		const message = firstArgument.split( '\n' );

		/* eslint-disable @stylistic/max-len */
		expect( message[ 0 ] ).toContain( 'Feature: Simple foo.' );
		expect( message[ 1 ] ).toContain( 'MAJOR BREAKING CHANGES: 1 - Reference site about Lorem Ipsum, giving information on its origins, as...' );
		expect( message[ 2 ] ).toContain( 'MAJOR BREAKING CHANGES: 2 - Reference site about Lorem Ipsum, giving information on its origins, as...' );
		expect( message[ 3 ] ).toContain( 'MINOR BREAKING CHANGES: 3 - Reference site about Lorem Ipsum, giving information on its origins, as...' );
		/* eslint-enable @stylistic/max-len */
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

			const [ firstCall ] = stubs.logger.info.mock.calls;
			const [ firstArgument ] = firstCall;
			const logMessage = firstArgument.split( '\n' );

			expect( logMessage[ 0 ] ).toContain( 'Fix: Simple fix.' );
			expect( logMessage[ 0 ] ).toContain( 'INCLUDED' );
			expect( logMessage[ 1 ] ).toContain( 'https://github.com/ckeditor/ckeditor5-foo/commit/684997d' );
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

			const [ firstCall ] = stubs.logger.info.mock.calls;
			const [ firstArgument ] = firstCall;

			expect( firstArgument.substring( 0, 3 ) ).toEqual( '   ' );
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

			const [ firstCall ] = stubs.logger.info.mock.calls;
			const [ firstArgument ] = firstCall;
			const [ firstLine, secondLine ] = firstArgument.split( '\n' );

			expect( firstLine.substring( 0, 3 ) ).toEqual( ' '.repeat( 3 ) );
			expect( secondLine.substring( 0, 13 ) ).toEqual( ' '.repeat( 13 ) );
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 1 );

			const [ firstCall ] = stubs.logger.info.mock.calls;
			const [ firstArgument ] = firstCall;
			const [ firstLine, secondLine, thirdLine ] = firstArgument.split( '\n' );

			expect( firstLine.substring( 0, 6 ) ).toEqual( ' '.repeat( 6 ) );
			expect( secondLine.substring( 0, 16 ) ).toEqual( ' '.repeat( 16 ) );
			expect( thirdLine.substring( 0, 16 ) ).toEqual( ' '.repeat( 16 ) );
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 6 );

			const [ , secondCall, , , fifthCall ] = stubs.logger.info.mock.calls;
			const [ secondCallfirstArgument ] = secondCall;
			const [ fifthCallfirstArgument ] = fifthCall;

			// Calls: 0, 2, 3, and 5 display the commit data.
			expect( secondCallfirstArgument ).toMatch( /-----/ );
			expect( fifthCallfirstArgument ).toMatch( /-----/ );
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 5 );

			const [ , secondCall, , , fifthCall ] = stubs.logger.info.mock.calls;
			const [ secondCallfirstArgument ] = secondCall;
			const [ fifthCallfirstArgument ] = fifthCall;

			// Calls: 0, 2, and 3  display the commit data.
			expect( secondCallfirstArgument ).toMatch( /-----/ );
			expect( fifthCallfirstArgument ).toMatch( /-----/ );
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 5 );

			const [ firstCall, , , fourthCall ] = stubs.logger.info.mock.calls;
			const [ firstCallfirstArgument ] = firstCall;
			const [ fourthCallfirstArgument ] = fourthCall;

			// Calls: 1, 2, and 4 display the commit data.
			expect( firstCallfirstArgument ).toMatch( /-----/ );
			expect( fourthCallfirstArgument ).toMatch( /-----/ );
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 7 );

			const [ firstCall, , , fourthCall, fifthCall, , seventhCall ] = stubs.logger.info.mock.calls;
			const [ firstCallfirstArgument ] = firstCall;
			const [ fourthCallfirstArgument ] = fourthCall;
			const [ fifthCallfirstArgument ] = fifthCall;
			const [ seventhCallfirstArgument ] = seventhCall;

			// Calls: 1, 2, 4, and 5 display the commit data.
			expect( firstCallfirstArgument ).toMatch( /-----/ );
			expect( fourthCallfirstArgument ).toMatch( /-----/ );
			expect( fifthCallfirstArgument ).not.toMatch( /-----/ );
			expect( seventhCallfirstArgument ).toMatch( /-----/ );
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

			expect( stubs.logger.info ).toHaveBeenCalledTimes( 9 );

			const [ firstCall, , , fourthCall, , sixthCall, , , ninethCall ] = stubs.logger.info.mock.calls;
			const [ firstCallfirstArgument ] = firstCall;
			const [ fourthCallfirstArgument ] = fourthCall;
			const [ sixthCallfirstArgument ] = sixthCall;
			const [ ninethCallfirstArgument ] = ninethCall;

			// Calls: 1, 2, 4, 6, and 7 display the commit data.
			expect( firstCallfirstArgument ).to.match( /-----/ );
			expect( fourthCallfirstArgument ).to.match( /-----/ );

			expect( sixthCallfirstArgument ).to.match( /-----/ );
			expect( ninethCallfirstArgument ).to.match( /-----/ );
		} );
	} );
} );
