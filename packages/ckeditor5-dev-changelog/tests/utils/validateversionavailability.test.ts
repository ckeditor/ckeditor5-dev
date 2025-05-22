/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { npm } from '@ckeditor/ckeditor5-dev-utils';
import { validateVersionAvailability } from '../../src/utils/validateversionavailability.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'validateVersionAvailability', () => {
	beforeEach( () => {
		vi.mocked( npm.checkVersionAvailability ).mockClear();
	} );

	it( 'should accept "internal" as a special version', async () => {
		const result = await validateVersionAvailability( 'internal', 'test-package' );

		expect( result ).toBe( true );
		expect( npm.checkVersionAvailability ).not.toHaveBeenCalled();
	} );

	it( 'should return error message when version is already taken', async () => {
		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( false );

		const result = await validateVersionAvailability( '1.0.0', 'test-package' );

		expect( result ).toBe( 'Given version is already taken.' );
		expect( npm.checkVersionAvailability ).toHaveBeenCalledWith( '1.0.0', 'test-package' );
	} );

	it( 'should return true when version is available', async () => {
		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );

		const result = await validateVersionAvailability( '1.0.0', 'test-package' );

		expect( result ).toBe( true );
		expect( npm.checkVersionAvailability ).toHaveBeenCalledWith( '1.0.0', 'test-package' );
	} );

	it( 'should pass through errors from checkVersionAvailability', async () => {
		const errorMessage = 'Network error';
		vi.mocked( npm.checkVersionAvailability ).mockRejectedValue( new Error( errorMessage ) );

		await expect( validateVersionAvailability( '1.0.0', 'test-package' ) ).rejects.toThrow( errorMessage );
		expect( npm.checkVersionAvailability ).toHaveBeenCalledWith( '1.0.0', 'test-package' );
	} );

	it.each( [
		'package-a',
		'package-b',
		'@scope/package-c'
	] )( 'should check availability for package "%s"', async ( packageName ) => {
		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );
		vi.mocked( npm.checkVersionAvailability ).mockClear();

		const result = await validateVersionAvailability( '1.0.0', packageName );

		expect( result ).toBe( true );
		expect( npm.checkVersionAvailability ).toHaveBeenCalledWith( '1.0.0', packageName );
	} );
} );
