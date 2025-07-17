/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promptReleaseType } from '../../src/utils/promptreleasetype.js';
import inquirer from 'inquirer';

vi.mock( 'inquirer' );

describe( 'promptReleaseType()', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'should return latest when user selects latest release', async () => {
		vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'latest' } );

		const result = await promptReleaseType();

		expect( result ).toBe( 'latest' );
		expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
			message: 'Select the release type?',
			name: 'releaseType',
			type: 'list',
			choices: [
				{ name: 'Latest (stable) release', value: 'latest' },
				{ name: 'Pre-release (alpha/beta/rc)', value: 'prerelease' }
			]
		} ] );
	} );

	it( 'should return prerelease when user selects prerelease', async () => {
		vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease' } );

		const result = await promptReleaseType();

		expect( result ).toBe( 'prerelease' );
		expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
			message: 'Select the release type?',
			name: 'releaseType',
			type: 'list',
			choices: [
				{ name: 'Latest (stable) release', value: 'latest' },
				{ name: 'Pre-release (alpha/beta/rc)', value: 'prerelease' }
			]
		} ] );
	} );

	it( 'should call select with correct configuration', async () => {
		vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'latest' } );

		await promptReleaseType();

		expect( inquirer.prompt ).toHaveBeenCalledTimes( 1 );
		expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
			message: 'Select the release type?',
			name: 'releaseType',
			type: 'list',
			choices: [
				{ name: 'Latest (stable) release', value: 'latest' },
				{ name: 'Pre-release (alpha/beta/rc)', value: 'prerelease' }
			]
		} ] );
	} );

	it( 'should handle select rejection', async () => {
		const error = new Error( 'User canceled' );
		vi.mocked( inquirer.prompt ).mockRejectedValue( error );

		await expect( promptReleaseType() ).rejects.toThrow( 'User canceled' );
	} );

	it( 'should handle select throwing an error', async () => {
		const error = new Error( 'Prompt failed' );
		vi.mocked( inquirer.prompt ).mockImplementation( () => {
			throw error;
		} );

		await expect( promptReleaseType() ).rejects.toThrow( 'Prompt failed' );
	} );
} );
