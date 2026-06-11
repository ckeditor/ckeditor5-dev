/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test, vi } from 'vitest';
import { cacheValue, stringifyValues, toPublicFilePath, toPublicSpecifier } from '../src/utils.js';

describe( 'cacheValue()', () => {
	test( 'computes the value once until invalidated', () => {
		const compute = vi.fn( () => ( {} ) );
		const cache = cacheValue( compute );
		const initialValue = cache.get();

		expect( cache.get() ).to.equal( initialValue );
		expect( compute ).toHaveBeenCalledTimes( 1 );

		cache.invalidate();
		const updatedValue = cache.get();

		expect( updatedValue ).not.to.equal( initialValue );
		expect( cache.get() ).to.equal( updatedValue );
		expect( compute ).toHaveBeenCalledTimes( 2 );
	} );
} );

describe( 'stringifyValues()', () => {
	test( 'JSON-stringifies object values', () => {
		expect( stringifyValues( {
			array: [ 'foo' ],
			boolean: true,
			number: 5,
			string: 'bar'
		} ) ).to.deep.equal( {
			array: '["foo"]',
			boolean: 'true',
			number: '5',
			string: '"bar"'
		} );
	} );
} );

describe( 'public path utilities', () => {
	test( 'returns a public path for files inside the workspace', () => {
		expect( toPublicFilePath( '/workspace/packages/foo/manual.html', '/workspace' ) )
			.to.equal( '/packages/foo/manual.html' );
	} );

	test( 'returns a Vite file-system path for files outside the workspace', () => {
		expect( toPublicFilePath( '/external/theme/shell.ts', '/workspace' ) )
			.to.equal( '/@fs//external/theme/shell.ts' );
	} );

	test( 'normalizes public specifiers', () => {
		expect( toPublicSpecifier( '\\packages\\foo\\manual.html' ) ).to.equal( '/packages/foo/manual.html' );
	} );
} );
