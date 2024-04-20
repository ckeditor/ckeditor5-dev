/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect } from 'vitest';
import upath from 'upath';
import { getCwdPath, camelize, camelizeObjectKeys } from '../src/utils.js';

test( 'getPath()', () => {
	expect( getCwdPath( 'dist', 'index.js' ) ).toBe( upath.join( process.cwd(), '/dist/index.js' ) );
} );

test( 'camelize()', () => {
	expect( camelize( 'this-is-a-test' ) ).toBe( 'thisIsATest' );
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
