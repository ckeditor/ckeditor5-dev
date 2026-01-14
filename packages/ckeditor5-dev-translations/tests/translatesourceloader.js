/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import translateSourceLoader from '../lib/translatesourceloader.js';

describe( 'dev-translations/translateSourceLoader()', () => {
	it( 'should return translated code', () => {
		const ctx = {
			query: {
				translateSource: vi.fn( () => 'output' )
			},
			resourcePath: 'file.js',
			callback: vi.fn()
		};

		const map = {};
		translateSourceLoader.call( ctx, 'Source', map );

		expect( ctx.query.translateSource ).toHaveBeenCalledOnce();
		expect( ctx.query.translateSource ).toHaveBeenCalledWith( 'Source', 'file.js' );

		expect( ctx.callback ).toHaveBeenCalledOnce();
		expect( ctx.callback.mock.calls[ 0 ][ 0 ] ).to.equal( null );
		expect( ctx.callback.mock.calls[ 0 ][ 1 ] ).to.equal( 'output' );
		expect( ctx.callback.mock.calls[ 0 ][ 2 ] ).to.equal( map );
	} );
} );
