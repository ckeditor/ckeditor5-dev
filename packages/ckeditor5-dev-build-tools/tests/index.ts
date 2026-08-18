/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import * as buildTools from '../src/index.js';

describe( 'index exports', () => {
	it( 'exports the public build tools API', () => {
		expect( buildTools.build ).toBeTypeOf( 'function' );
		expect( buildTools.addBanner ).toBeTypeOf( 'function' );
		expect( buildTools.bundleCss ).toBeTypeOf( 'function' );
		expect( buildTools.declarationFiles ).toBeTypeOf( 'function' );
		expect( buildTools.loadSourcemaps ).toBeTypeOf( 'function' );
		expect( buildTools.rawImport ).toBeTypeOf( 'function' );
		expect( buildTools.translations ).toBeTypeOf( 'function' );
	} );
} );
