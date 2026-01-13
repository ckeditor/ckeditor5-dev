/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { getReleaseType } from '../../src/utils/getreleasetype.js';

describe( 'getReleaseType()', () => {
	it( 'should return latest for major.minor.patch version', () => {
		const result = getReleaseType( '1.0.0', '2.0.0' );

		expect( result ).toBe( 'latest' );
	} );

	it( 'should return prerelease for same channel version', () => {
		const result = getReleaseType( '1.0.0-alpha.1', '1.0.0-alpha.2' );

		expect( result ).toBe( 'prerelease' );
	} );

	it( 'should return prerelease-promote for different channels', () => {
		const result = getReleaseType( '1.0.0-alpha.1', '1.0.0-beta.0' );

		expect( result ).toBe( 'prerelease-promote' );
	} );

	it( 'should return latest for pre-release promotion to latest', () => {
		const result = getReleaseType( '2.0.0-alpha.0', '2.0.0' );

		expect( result ).toBe( 'latest' );
	} );

	it( 'should return prerelease-promote for latest promotion to pre-release', () => {
		const result = getReleaseType( '1.0.0', '2.0.0-alpha.0' );

		expect( result ).toBe( 'prerelease-promote' );
	} );
} );
