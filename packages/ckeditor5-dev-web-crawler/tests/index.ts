/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test } from 'vitest';
import * as api from '../src/index.js';

describe( 'index exports', () => {
	test( 're-exports the public API', () => {
		expect( typeof api.runCrawler ).toBe( 'function' );
		expect( typeof api.getBaseUrl ).toBe( 'function' );
		expect( typeof api.isUrlValid ).toBe( 'function' );
		expect( typeof api.toArray ).toBe( 'function' );
		expect( api.DEFAULT_CONCURRENCY ).toBeTruthy();
		expect( api.DEFAULT_TIMEOUT ).toBeTruthy();
	} );
} );
