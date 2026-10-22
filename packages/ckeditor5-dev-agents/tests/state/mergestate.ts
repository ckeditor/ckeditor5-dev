/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { mergeBaseline, mergeOpenFindings } from '../../src/state/mergestate.js';
import type { Finding } from '../../src/types.js';

describe( 'mergeOpenFindings()', () => {
	const finding = ( fingerprint: string, detail = 'Bad.' ): Finding => ( {
		fingerprint, id: fingerprint, task: 't', unit: 'u', ruleId: 'R1', discriminator: '', detail, fragment: 'f'
	} );

	it( 'drops a finding removed on either side, keeps the added ones, and sorts them', () => {
		const base = [ finding( 'a' ), finding( 'b' ), finding( 'c' ) ];
		const ours = [ finding( 'a' ), finding( 'b' ), finding( 'e' ) ];
		const theirs = [ finding( 'b' ), finding( 'c' ), finding( 'd' ) ];

		expect( mergeOpenFindings( base, ours, theirs ).map( item => item.fingerprint ) ).toEqual( [ 'b', 'd', 'e' ] );
	} );

	it( 'takes the change of the side that changed a finding, and ours when both did', () => {
		const base = [ finding( 'a' ), finding( 'b' ) ];
		const ours = [ finding( 'a' ), finding( 'b', 'Ours.' ) ];
		const theirs = [ finding( 'a', 'Theirs.' ), finding( 'b', 'Also theirs.' ) ];

		expect( mergeOpenFindings( base, ours, theirs ).map( item => item.detail ) ).toEqual( [ 'Theirs.', 'Ours.' ] );
	} );
} );

describe( 'mergeBaseline()', () => {
	it( 'drops a unit removed on either side, so it is judged again, and keeps the others with their latest hash', () => {
		const base = { 'a.md': '1', 'b.md': '1', 'c.md': '1' };
		const ours = { 'a.md': '2', 'b.md': '1', 'c.md': '1', 'e.md': '1' };
		const theirs = { 'a.md': '1', 'c.md': '3', 'd.md': '1' };

		expect( mergeBaseline( base, ours, theirs ) ).toEqual( { 'a.md': '2', 'c.md': '3', 'd.md': '1', 'e.md': '1' } );
		expect( Object.keys( mergeBaseline( base, ours, theirs ) ) ).toEqual( [ 'a.md', 'c.md', 'd.md', 'e.md' ] );
	} );
} );
