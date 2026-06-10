/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test } from 'vitest';
import { stringifyValues, toPublicFilePath, toPublicSpecifier } from '../src/utils.js';

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
