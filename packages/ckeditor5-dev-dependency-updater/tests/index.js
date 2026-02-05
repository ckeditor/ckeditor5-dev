/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';

describe( 'src/index.ts', () => {
	it( 'should export "runCli"', async () => {
		const exports = await import( '../src/index.ts' );

		expect( exports.runCli ).to.be.an( 'function' );
	} );

	it( 'should export "upgradeDependency"', async () => {
		const exports = await import( '../src/index.ts' );

		expect( exports.upgradeDependency ).to.be.an( 'function' );
	} );
} );
