/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { describe, it, expect } from 'vitest';
import { getFindingId, getFingerprint, validateFindings } from '../../src/runner/validatefindings.js';
import { hash } from '../../src/utils/text.js';

describe( 'getFingerprint()', () => {
	it( 'escapes separators and escape characters without colliding with another tuple', () => {
		const first = getFingerprint( { task: 't', unit: 'a|R1', ruleId: 'R2', discriminator: '' } );
		const second = getFingerprint( { task: 't', unit: 'a', ruleId: 'R1', discriminator: 'R2|' } );

		expect( first ).not.toBe( second );
		expect( getFingerprint( { task: 't', unit: 'a\\|b', ruleId: 'R1', discriminator: '' } ) ).not.toBe(
			getFingerprint( { task: 't', unit: 'a|b', ruleId: 'R1', discriminator: '' } )
		);
	} );

	it( 'joins the task, unit, rule and discriminator', () => {
		expect( getFingerprint( { task: 't', unit: 'u', ruleId: 'R1', discriminator: 'd' } ) ).toBe( 't|u|R1|d' );
	} );
} );

describe( 'getFindingId()', () => {
	it( 'returns the full hash of the fingerprint, which starts with the short ID', () => {
		expect( getFindingId( 't|u|R1|' ) ).toMatch( /^[0-9a-f]{64}$/ );
		expect( getFindingId( 't|u|R1|' ).startsWith( hash( 't|u|R1|' ) ) ).toBe( true );
	} );
} );

describe( 'validateFindings()', () => {
	const task = { id: 't', ruleIds: [ 'R1', 'R2' ] };
	const unit = { key: 'docs/a.md', path: 'docs/a.md' };

	it( 'turns the findings into stored findings', () => {
		expect( validateFindings( [
			{ ruleId: 'R1', detail: '  Too long.  ' },
			{ ruleId: 'R2', detail: 'Missing.', discriminator: 'Heading', suggestion: 'Add it.' }
		], { task, unit, fragment: 'abc' } ) ).toEqual( [
			{
				fingerprint: 't|docs/a.md|R1|',
				id: hash( 't|docs/a.md|R1|' ),
				task: 't',
				unit: 'docs/a.md',
				ruleId: 'R1',
				discriminator: '',
				detail: 'Too long.',
				fragment: 'abc',
				path: 'docs/a.md'
			},
			{
				fingerprint: 't|docs/a.md|R2|Heading',
				id: hash( 't|docs/a.md|R2|Heading' ),
				task: 't',
				unit: 'docs/a.md',
				ruleId: 'R2',
				discriminator: 'Heading',
				detail: 'Missing.',
				fragment: 'abc',
				path: 'docs/a.md',
				suggestion: 'Add it.'
			}
		] );
	} );

	it( 'does not set `path` for units without one', () => {
		const [ finding ] = validateFindings( [ { ruleId: 'R1', detail: 'x' } ], { task, unit: { key: 'k' }, fragment: 'abc' } );

		expect( finding ).not.toHaveProperty( 'path' );
	} );

	it( 'ignores the fields the harness owns', () => {
		const [ finding ] = validateFindings( [ {
			ruleId: 'R1',
			detail: 'x',
			fingerprint: 'fake',
			id: 'fake',
			task: 'other',
			unit: 'other',
			fragment: 'fake',
			reportedAt: 'fake',
			fix: 'fake'
		} ], { task, unit, fragment: 'abc' } );

		expect( finding ).toMatchObject( {
			fingerprint: 't|docs/a.md|R1|', id: hash( 't|docs/a.md|R1|' ), task: 't', unit: 'docs/a.md', fragment: 'abc'
		} );
		expect( finding ).not.toHaveProperty( 'reportedAt' );
		expect( finding ).not.toHaveProperty( 'fix' );
	} );

	it( 'throws when the result is not an array', () => {
		expect( () => validateFindings( {}, { task, unit, fragment: 'abc' } ) ).toThrow( '`judge()` must return an array of findings.' );
	} );

	it.each( [
		[ 'null', null, 'Finding #0 must be an object.' ],
		[ 'an array', [], 'Finding #0 must be an object.' ],
		[ 'a string', 'x', 'Finding #0 must be an object.' ],
		[ 'an unknown rule', { ruleId: 'X', detail: 'x' }, 'Finding #0 refers to the unknown "X" rule.' ],
		[ 'a rule that is not a string', { ruleId: 1, detail: 'x' }, 'Finding #0 refers to the unknown "1" rule.' ],
		[ 'no detail', { ruleId: 'R1' }, 'Finding #0 must have a non-empty "detail".' ],
		[ 'an empty detail', { ruleId: 'R1', detail: '  ' }, 'Finding #0 must have a non-empty "detail".' ],
		[ 'a discriminator that is not a string', { ruleId: 'R1', detail: 'x', discriminator: 1 }, 'The "discriminator" of finding #0 must be a string.' ]
	] )( 'throws for a finding with %s', ( _name, finding, message ) => {
		expect( () => validateFindings( [ finding ], { task, unit, fragment: 'abc' } ) ).toThrow( message );
	} );
} );
