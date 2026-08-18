/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import { camelize, camelizeObjectKeys, getUserDependency, removeNewline } from '../src/utils.js';

describe( 'utils', () => {
	it( 'camelize()', () => {
		expect( camelize( 'this-is-a-test' ) ).toBe( 'thisIsATest' );
	} );

	it( 'removeNewline()', () => {
		const newLines = `line1;
line2;`;
		expect( removeNewline( newLines ) ).toBe( 'line1;line2;' );
	} );

	it( 'camelizeObjectKeys()', () => {
		expect( camelizeObjectKeys( {
			'test-one': 1,
			'test-two': 2,
			'test-nested': {
				'test-three': 3
			}
		} ) ).toStrictEqual( {
			testOne: 1,
			testTwo: 2,
			testNested: {
				'test-three': 3
			}
		} );
	} );

	it( 'getUserDependency()', () => {
		expect( getUserDependency( 'upath' ) ).toBeDefined();
	} );
} );
