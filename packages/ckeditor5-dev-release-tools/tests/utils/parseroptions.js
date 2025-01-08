/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import parserOptions from '../../lib/utils/parseroptions.js';

describe( 'parser-options', () => {
	it( 'should not hoist closed tickets', () => {
		expect( parserOptions.referenceActions ).to.deep.equal( [] );
	} );
} );
