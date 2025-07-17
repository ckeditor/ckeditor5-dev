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

	it( 'should return latest when user selects no (not a pre-release)', async () => {
		vi.mocked( inquirer.prompt ).mockResolvedValue( { isPrerelease: false } );

		const result = await promptReleaseType();

		expect( result ).toBe( 'latest' );
		expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
			message: 'Is it a pre-release?',
			name: 'isPrerelease',
			type: 'confirm',
			default: false
		} ] );
	} );

	it( 'should return prerelease when user selects yes (is a pre-release)', async () => {
		vi.mocked( inquirer.prompt ).mockResolvedValue( { isPrerelease: true } );

		const result = await promptReleaseType();

		expect( result ).toBe( 'prerelease' );
		expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
			message: 'Is it a pre-release?',
			name: 'isPrerelease',
			type: 'confirm',
			default: false
		} ] );
	} );

	it( 'should call confirm with correct configuration', async () => {
		vi.mocked( inquirer.prompt ).mockResolvedValue( { isPrerelease: false } );

		await promptReleaseType();

		expect( inquirer.prompt ).toHaveBeenCalledTimes( 1 );
		expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
			message: 'Is it a pre-release?',
			name: 'isPrerelease',
			type: 'confirm',
			default: false
		} ] );
	} );

	it( 'should handle confirm rejection', async () => {
		const error = new Error( 'User canceled' );
		vi.mocked( inquirer.prompt ).mockRejectedValue( error );

		await expect( promptReleaseType() ).rejects.toThrow( 'User canceled' );
	} );

	it( 'should handle confirm throwing an error', async () => {
		const error = new Error( 'Prompt failed' );
		vi.mocked( inquirer.prompt ).mockImplementation( () => {
			throw error;
		} );

		await expect( promptReleaseType() ).rejects.toThrow( 'Prompt failed' );
	} );
} );
