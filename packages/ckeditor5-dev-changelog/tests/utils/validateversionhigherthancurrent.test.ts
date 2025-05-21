/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import semver from 'semver';
import { validateVersionHigherThanCurrent } from '../../src/utils/validateversionhigherthancurrent.js';

vi.mock( 'semver' );

describe( 'validateVersionHigherThanCurrent', () => {
	it( 'should accept "internal" as a special version', () => {
		vi.mocked( semver.gt ).mockClear();

		const result = validateVersionHigherThanCurrent( 'internal', '1.0.0' );

		expect( result ).toBe( true );
		expect( semver.gt ).not.toHaveBeenCalled();
	} );

	it( 'should return error message when version is not greater than current', () => {
		vi.mocked( semver.gt ).mockReturnValue( false );

		const result = validateVersionHigherThanCurrent( '1.0.0', '1.0.0' );

		expect( result ).toBe( 'Provided version must be higher than "1.0.0".' );
		expect( semver.gt ).toHaveBeenCalledWith( '1.0.0', '1.0.0' );
	} );

	it( 'should return true when version is greater than current', () => {
		vi.mocked( semver.gt ).mockReturnValue( true );

		const result = validateVersionHigherThanCurrent( '1.1.0', '1.0.0' );

		expect( result ).toBe( true );
		expect( semver.gt ).toHaveBeenCalledWith( '1.1.0', '1.0.0' );
	} );

	it( 'should compare versions correctly for different scenarios', () => {
		const testCases = [
			{ version: '1.0.1', current: '1.0.0', gtResult: true, expected: true },
			{ version: '1.1.0', current: '1.0.0', gtResult: true, expected: true },
			{ version: '2.0.0', current: '1.0.0', gtResult: true, expected: true },
			{ version: '1.0.0', current: '1.0.0', gtResult: false, expected: 'Provided version must be higher than "1.0.0".' },
			{ version: '0.9.9', current: '1.0.0', gtResult: false, expected: 'Provided version must be higher than "1.0.0".' }
		];

		for ( const { version, current, gtResult, expected } of testCases ) {
			vi.mocked( semver.gt ).mockReturnValue( gtResult );

			const result = validateVersionHigherThanCurrent( version, current );

			expect( result ).toBe( expected );
			expect( semver.gt ).toHaveBeenCalledWith( version, current );
		}
	} );
} );
