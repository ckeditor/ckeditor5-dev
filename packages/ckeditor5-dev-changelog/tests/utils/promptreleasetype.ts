/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promptReleaseType } from '../../src/utils/promptreleasetype.js';
import { select } from '@inquirer/prompts';

vi.mock( '@inquirer/prompts' );

describe( 'promptReleaseType()', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'should return latest when user selects latest release', async () => {
		vi.mocked( select ).mockResolvedValue( 'latest' );

		const result = await promptReleaseType();

		expect( result ).toBe( 'latest' );
		expect( select ).toHaveBeenCalledWith( {
			message: 'Select the release type?',
			choices: [
				{ name: 'Latest (stable) release', value: 'latest' },
				{ name: 'Pre-release (alpha/beta/rc)', value: 'prerelease' }
			]
		} );
	} );

	it( 'should return prerelease when user selects prerelease', async () => {
		vi.mocked( select ).mockResolvedValue( 'prerelease' );

		const result = await promptReleaseType();

		expect( result ).toBe( 'prerelease' );
		expect( select ).toHaveBeenCalledWith( {
			message: 'Select the release type?',
			choices: [
				{ name: 'Latest (stable) release', value: 'latest' },
				{ name: 'Pre-release (alpha/beta/rc)', value: 'prerelease' }
			]
		} );
	} );

	it( 'should call select with correct configuration', async () => {
		vi.mocked( select ).mockResolvedValue( 'latest' );

		await promptReleaseType();

		expect( select ).toHaveBeenCalledTimes( 1 );
		expect( select ).toHaveBeenCalledWith( {
			message: 'Select the release type?',
			choices: [
				{ name: 'Latest (stable) release', value: 'latest' },
				{ name: 'Pre-release (alpha/beta/rc)', value: 'prerelease' }
			]
		} );
	} );

	it( 'should handle select rejection', async () => {
		const error = new Error( 'User canceled' );
		vi.mocked( select ).mockRejectedValue( error );

		await expect( promptReleaseType() ).rejects.toThrow( 'User canceled' );
	} );

	it( 'should handle select throwing an error', async () => {
		const error = new Error( 'Prompt failed' );
		vi.mocked( select ).mockImplementation( () => {
			throw error;
		} );

		await expect( promptReleaseType() ).rejects.toThrow( 'Prompt failed' );
	} );

	it( 'should return the correct type when select returns unexpected value', async () => {
		vi.mocked( select ).mockResolvedValue( 'latest' as any );

		const result = await promptReleaseType();

		expect( result ).toBe( 'latest' );
	} );
} );
