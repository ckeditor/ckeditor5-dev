/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import * as constants from '../../lib/utils/constants.js';

describe( 'constants', () => {
	it( '#CHANGELOG_FILE', async () => {
		expect( constants.CHANGELOG_FILE ).to.be.a( 'string' );
	} );

	it( '#CHANGELOG_HEADER', async () => {
		expect( constants.CHANGELOG_HEADER ).to.be.a( 'string' );
	} );
} );
