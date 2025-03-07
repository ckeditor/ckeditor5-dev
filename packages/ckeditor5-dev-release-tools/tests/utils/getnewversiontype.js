/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import getNewVersionType from '../../lib/utils/getnewversiontype.js';

describe( 'getSubPackagesPaths()', () => {
	it( 'returns "skip" when passing an empty array of commits', () => {
		expect( getNewVersionType( [] ) ).toEqual( 'skip' );
	} );

	it( 'returns "internal" when passing non-public commits', () => {
		expect( getNewVersionType( [ { isPublicCommit: false } ] ) ).toEqual( 'internal' );
	} );

	it( 'returns "major" if MAJOR BREAKING CHANGES was introduced in "type:Other" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'MAJOR BREAKING CHANGES' } ], rawType: 'Other' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'major' );
	} );

	it( 'returns "major" if BREAKING CHANGES was introduced in "type:Other" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'BREAKING CHANGES' } ], rawType: 'Other' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'major' );
	} );

	it( 'returns "major" if MAJOR BREAKING CHANGES was introduced in "type:Fix" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'MAJOR BREAKING CHANGES' } ], rawType: 'Fix' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'major' );
	} );

	it( 'returns "major" if BREAKING CHANGES was introduced in "type:Fix" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'BREAKING CHANGES' } ], rawType: 'Fix' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'major' );
	} );

	it( 'returns "major" if MAJOR BREAKING CHANGES was introduced in "type:Feature" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'MAJOR BREAKING CHANGES' } ], rawType: 'Feature' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'major' );
	} );

	it( 'returns "major" if BREAKING CHANGES was introduced in "type:Feature" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'BREAKING CHANGES' } ], rawType: 'Feature' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'major' );
	} );

	it( 'returns "minor" if MINOR BREAKING CHANGES was introduced in "type:Other" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'MINOR BREAKING CHANGES' } ], rawType: 'Other' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'minor' );
	} );

	it( 'returns "minor" if MINOR BREAKING CHANGES was introduced in "type:Fix" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'MINOR BREAKING CHANGES' } ], rawType: 'Fix' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'minor' );
	} );

	it( 'returns "minor" if MINOR BREAKING CHANGES was introduced in "type:Feature" commit', () => {
		const commits = [
			{ isPublicCommit: true, notes: [ { title: 'MINOR BREAKING CHANGES' } ], rawType: 'Feature' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'minor' );
	} );

	it( 'returns "minor" if found "type:Feature" commit in the collection', () => {
		const commits = [
			{ isPublicCommit: true, notes: [], rawType: 'Fix' },
			{ isPublicCommit: true, notes: [], rawType: 'Other' },
			{ isPublicCommit: false, notes: [], rawType: 'Docs' },
			{ isPublicCommit: true, notes: [], rawType: 'Feature' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'minor' );
	} );

	it( 'returns "major" if found "MAJOR BREAKING CHANGES" commit in the collection', () => {
		const commits = [
			{ isPublicCommit: true, notes: [], rawType: 'Fix' },
			{ isPublicCommit: true, notes: [], rawType: 'Other' },
			{ isPublicCommit: false, notes: [], rawType: 'Docs' },
			{
				isPublicCommit: true,
				notes: [
					{ title: 'MINOR BREAKING CHANGES' },
					{ title: 'MAJOR BREAKING CHANGES' }
				],
				rawType: 'Feature'
			}
		];
		expect( getNewVersionType( commits ) ).toEqual( 'major' );
	} );

	it( 'returns "patch" if no breaking changes or features commits were made', () => {
		const commits = [
			{ isPublicCommit: true, notes: [], rawType: 'Fix' },
			{ isPublicCommit: true, notes: [], rawType: 'Other' }
		];
		expect( getNewVersionType( commits ) ).toEqual( 'patch' );
	} );
} );
