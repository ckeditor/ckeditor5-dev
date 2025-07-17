/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getReleaseTypeFromVersion } from '../../src/utils/getreleasetypefromversion.js';

describe( 'getReleaseTypeFromVersion()', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'should return latest for major.minor.patch version', () => {
		const result = getReleaseTypeFromVersion( '1.0.0' );

		expect( result ).toBe( 'latest' );
	} );

	it( 'should return prerelease for alpha version', () => {
		const result = getReleaseTypeFromVersion( '1.0.0-alpha.1' );

		expect( result ).toBe( 'prerelease' );
	} );

	it( 'should return prerelease for beta version', () => {
		const result = getReleaseTypeFromVersion( '1.0.0-beta.2' );

		expect( result ).toBe( 'prerelease' );
	} );

	it( 'should return prerelease for rc version', () => {
		const result = getReleaseTypeFromVersion( '1.0.0-rc.3' );

		expect( result ).toBe( 'prerelease' );
	} );
} );
