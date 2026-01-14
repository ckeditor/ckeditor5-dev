/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { npm } from '@ckeditor/ckeditor5-dev-utils';
import { validateInputVersion } from '../../src/utils/validateinputversion.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'validateInputVersion()', () => {
	const defaultOptions = {
		version: '1.0.0',
		releaseType: 'latest' as const,
		packageName: 'test-package',
		suggestedVersion: '1.0.1'
	};

	beforeEach( () => {
		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );
	} );

	describe( 'semver validation', () => {
		it( 'should return error for internal version', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: 'internal'
			} );

			expect( result ).toBe( 'Please provide a valid version.' );
		} );

		it( 'should return error for invalid semver version', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: 'invalid-version'
			} );

			expect( result ).toBe( 'Please provide a valid version.' );
		} );

		it( 'should return error when version is not higher than current', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.0'
			} );

			expect( result ).toBe( 'Provided version must be higher than "1.0.0".' );
		} );

		it( 'should return error when version is lower than current', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '0.9.9',
				version: '1.0.0'
			} );

			expect( result ).toBe( 'Provided version must be higher than "1.0.0".' );
		} );

		it( 'should return error when version is equal to current', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.0',
				version: '1.0.0'
			} );

			expect( result ).toBe( 'Provided version must be higher than "1.0.0".' );
		} );
	} );

	describe( 'npm availability check', () => {
		it( 'should return error when version is already taken', async () => {
			vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( false );

			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1'
			} );

			expect( result ).toBe( 'Given version is already taken.' );
		} );
	} );

	describe( 'prerelease validation', () => {
		it( 'should return error for prerelease release type without channel suffix', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1',
				releaseType: 'prerelease'
			} );

			expect( result ).toBe( 'You chose the "pre-release" release type. Please provide a version with a channel suffix.' );
		} );

		it( 'should return error for prerelease-promote release type without channel suffix', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1',
				releaseType: 'prerelease-promote'
			} );

			expect( result ).toBe( 'You chose the "pre-release" release type. Please provide a version with a channel suffix.' );
		} );

		it( 'should accept prerelease version with channel suffix for prerelease release type', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1-alpha.0',
				releaseType: 'prerelease'
			} );

			expect( result ).toBe( true );
		} );

		it( 'should accept prerelease version with channel suffix for prerelease-promote release type', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1-beta.1',
				releaseType: 'prerelease-promote',
				suggestedVersion: '1.0.1-beta.1'
			} );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'prerelease-promote validation', () => {
		it( 'should return error when version is lower than suggested version', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.0-beta.0',
				releaseType: 'prerelease-promote',
				suggestedVersion: '1.0.1-beta.1',
				version: '1.0.0'
			} );

			expect( result ).toBe( 'Provided version must be higher than "1.0.0".' );
		} );

		it( 'should return error when version is the same than suggested version', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.0-beta.1',
				releaseType: 'prerelease-promote',
				suggestedVersion: '1.0.1-rc.0',
				version: '1.0.0-beta.0'
			} );

			expect( result ).toBe( 'Provided version must be higher or equal to "1.0.1-rc.0".' );
		} );
	} );

	describe( 'prerelease channel validation', () => {
		it( 'should return error when channel is different from current channel', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1-beta.0',
				releaseType: 'prerelease',
				version: '1.0.0-alpha.0'
			} );

			expect( result ).toBe( 'Provided channel must be the same existing channel alpha.' );
		} );

		it( 'should accept same channel for prerelease', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1-alpha.1',
				releaseType: 'prerelease',
				version: '1.0.0-alpha.0'
			} );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'latest release type validation', () => {
		it( 'should return error for latest release type with channel suffix', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1-alpha.0',
				releaseType: 'latest'
			} );

			expect( result ).toBe( 'You chose the "latest" release type. Please provide a version without a channel suffix.' );
		} );

		it( 'should accept stable version for latest release type', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1',
				releaseType: 'latest'
			} );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'successful validation cases', () => {
		it( 'should return true for valid stable version on latest release type', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1'
			} );

			expect( result ).toBe( true );
		} );

		it( 'should return true for valid prerelease version on prerelease release type', async () => {
			const result = await validateInputVersion( {
				...defaultOptions,
				newVersion: '1.0.1-alpha.0',
				releaseType: 'prerelease'
			} );

			expect( result ).toBe( true );
		} );
	} );
} );
