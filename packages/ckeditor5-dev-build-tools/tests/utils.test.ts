import { test, expect } from 'vitest';
import { getPath, camelize, camelizeObjectKeys } from '../src/utils.js';

test( 'getPath()', () => {
	expect( getPath( 'dist', 'index.js' ) ).toBe( process.cwd() + '/dist/index.js' );
} );

test( 'camelize()', () => {
	expect( camelize('this-is-a-test') ).toBe( 'thisIsATest' );
} );

test( 'camelizeObjectKeys()', () => {
	expect( camelizeObjectKeys({
		'test-one': 1,
		'test-two': 2,
		'test-nested': {
			'test-three': 3
		}
	}) ).toStrictEqual( {
		testOne: 1,
		testTwo: 2,
		testNested: {
			'test-three': 3
		}
	} );
} );
