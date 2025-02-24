/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect } from 'vitest';
import { camelize, camelizeObjectKeys, removeNewline } from '../src/utils.js';

test( 'camelize()', () => {
	expect( camelize( 'this-is-a-test' ) ).toBe( 'thisIsATest' );
} );

test( 'removeNewline()', () => {
	const newLines = `line1;
line2;`;
	expect( removeNewline( newLines ) ).toBe( 'line1;line2;' );
} );

test( 'camelizeObjectKeys()', () => {
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
