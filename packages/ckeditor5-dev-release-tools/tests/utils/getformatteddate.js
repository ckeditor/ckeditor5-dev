/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import getFormattedDate from '../../lib/utils/getformatteddate.js';

describe( 'getFormattedDate()', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		vi.setSystemTime( new Date( '2023-06-15 12:00:00' ) );
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'returns a date following the format "year-month-day" with the leading zeros', () => {
		expect( getFormattedDate() ).to.equal( '2023-06-15' );
	} );
} );
