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

	describe( 'for stable versions (e.g., 1.0.0)', () => {
		it( 'should return latest when user selects latest release', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'latest' } );

			const result = await promptReleaseType( '1.0.0' );

			expect( result ).toBe( 'latest' );
			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Select the release type. Current version: 1.0.0.',
				choices: [
					{ name: 'Latest (stable) release (2.0.0 | 1.1.0 | 1.0.1)', value: 'latest' },
					{ name: 'Pre-release (2.0.0-alpha.0 | 1.1.0-alpha.0 | 1.0.1-alpha.0)', value: 'prerelease' }
				]
			} ] );
		} );

		it( 'should return prerelease when user selects pre-release', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease' } );

			const result = await promptReleaseType( '1.0.0' );

			expect( result ).toBe( 'prerelease' );
		} );
	} );

	describe( 'for RC versions (e.g., 1.0.0-rc.1)', () => {
		it( 'should return latest when user selects latest release', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'latest' } );

			const result = await promptReleaseType( '1.0.0-rc.1' );

			expect( result ).toBe( 'latest' );
			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Select the release type. Current version: 1.0.0-rc.1.',
				choices: [
					{ name: 'Latest (stable) release (1.0.0)', value: 'latest' },
					{ name: 'Pre-release continuation (1.0.0-rc.2)', value: 'prerelease' }
				]
			} ] );
		} );

		it( 'should return prerelease when user selects pre-release continuation', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease' } );

			const result = await promptReleaseType( '1.0.0-rc.1' );

			expect( result ).toBe( 'prerelease' );
		} );
	} );

	describe( 'for alpha/beta versions (e.g., 1.0.0-alpha.1, 1.0.0-beta.2)', () => {
		it( 'should return latest when user selects latest release', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'latest' } );

			const result = await promptReleaseType( '1.0.0-alpha.1' );

			expect( result ).toBe( 'latest' );
			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Select the release type. Current version: 1.0.0-alpha.1.',
				choices: [
					{ name: 'Latest (stable) release (1.0.0)', value: 'latest' },
					{ name: 'Pre-release continuation (1.0.0-alpha.2)', value: 'prerelease' },
					{ name: 'Pre-release promotion (1.0.0-beta.0 | 1.0.0-rc.0)', value: 'prerelease-promote' }
				]
			} ] );
		} );

		it( 'should return prerelease when user selects pre-release continuation', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease' } );

			const result = await promptReleaseType( '1.0.0-beta.2' );

			expect( result ).toBe( 'prerelease' );
		} );

		it( 'should return prerelease-promote when user selects pre-release promotion', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease-promote' } );

			const result = await promptReleaseType( '1.0.0-alpha.1' );

			expect( result ).toBe( 'prerelease-promote' );
		} );
	} );

	describe( 'different version formats', () => {
		it( 'should handle stable version without prerelease', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'latest' } );

			await promptReleaseType( '2.5.3' );

			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Select the release type. Current version: 2.5.3.',
				choices: [
					{ name: 'Latest (stable) release (3.0.0 | 2.6.0 | 2.5.4)', value: 'latest' },
					{ name: 'Pre-release (3.0.0-alpha.0 | 2.6.0-alpha.0 | 2.5.4-alpha.0)', value: 'prerelease' }
				]
			} ] );
		} );

		it( 'should handle RC version', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease' } );

			await promptReleaseType( '3.0.0-rc.5' );

			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Select the release type. Current version: 3.0.0-rc.5.',
				choices: [
					{ name: 'Latest (stable) release (3.0.0)', value: 'latest' },
					{ name: 'Pre-release continuation (3.0.0-rc.6)', value: 'prerelease' }
				]
			} ] );
		} );

		it( 'should handle alpha version', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease-promote' } );

			await promptReleaseType( '4.1.0-alpha.3' );

			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Select the release type. Current version: 4.1.0-alpha.3.',
				choices: [
					{ name: 'Latest (stable) release (4.1.0)', value: 'latest' },
					{ name: 'Pre-release continuation (4.1.0-alpha.4)', value: 'prerelease' },
					{ name: 'Pre-release promotion (4.1.0-beta.0 | 4.1.0-rc.0)', value: 'prerelease-promote' }
				]
			} ] );
		} );

		it( 'should handle beta version', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'latest' } );

			await promptReleaseType( '5.2.1-beta.7' );

			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Select the release type. Current version: 5.2.1-beta.7.',
				choices: [
					{ name: 'Latest (stable) release (5.2.1)', value: 'latest' },
					{ name: 'Pre-release continuation (5.2.1-beta.8)', value: 'prerelease' },
					{ name: 'Pre-release promotion (5.2.1-rc.0)', value: 'prerelease-promote' }
				]
			} ] );
		} );
	} );

	describe( 'error handling', () => {
		it( 'should handle prompt rejection', async () => {
			const error = new Error( 'User canceled' );
			vi.mocked( inquirer.prompt ).mockRejectedValue( error );

			await expect( promptReleaseType( '1.0.0' ) ).rejects.toThrow( 'User canceled' );
		} );

		it( 'should handle prompt throwing an error', async () => {
			const error = new Error( 'Prompt failed' );
			vi.mocked( inquirer.prompt ).mockImplementation( () => {
				throw error;
			} );

			await expect( promptReleaseType( '1.0.0' ) ).rejects.toThrow( 'Prompt failed' );
		} );
	} );
} );
