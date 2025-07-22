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
				message: 'Please select the release type.',
				choices: [
					{ name: 'Latest (stable) release (e.g. 1.0.0 -> 2.0.0)', value: 'latest' },
					{ name: 'Pre-release (e.g. 1.0.0 -> 2.0.0-alpha.0)', value: 'prerelease' }
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
				message: 'Please select the release type.',
				choices: [
					{ name: 'Latest (stable) release (e.g. 1.0.0-beta.2 -> 1.0.0)', value: 'latest' },
					{ name: 'Pre-release continuation (e.g. 1.0.0-alpha.0 -> 1.0.0-alpha.1)', value: 'prerelease' }
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
				message: 'Please select the release type.',
				choices: [
					{ name: 'Latest (stable) release (e.g. 1.0.0-beta.2 -> 1.0.0)', value: 'latest' },
					{ name: 'Pre-release continuation (e.g. 1.0.0-alpha.0 -> 1.0.0-alpha.1)', value: 'prerelease' },
					{ name: 'Pre-release promotion (e.g. 1.0.0-alpha.1 -> 1.0.0-beta.0)', value: 'prerelease-promote' }
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
				message: 'Please select the release type.',
				choices: [
					{ name: 'Latest (stable) release (e.g. 1.0.0 -> 2.0.0)', value: 'latest' },
					{ name: 'Pre-release (e.g. 1.0.0 -> 2.0.0-alpha.0)', value: 'prerelease' }
				]
			} ] );
		} );

		it( 'should handle RC version', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease' } );

			await promptReleaseType( '3.0.0-rc.5' );

			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Please select the release type.',
				choices: [
					{ name: 'Latest (stable) release (e.g. 1.0.0-beta.2 -> 1.0.0)', value: 'latest' },
					{ name: 'Pre-release continuation (e.g. 1.0.0-alpha.0 -> 1.0.0-alpha.1)', value: 'prerelease' }
				]
			} ] );
		} );

		it( 'should handle alpha version', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'prerelease-promote' } );

			await promptReleaseType( '4.1.0-alpha.3' );

			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Please select the release type.',
				choices: [
					{ name: 'Latest (stable) release (e.g. 1.0.0-beta.2 -> 1.0.0)', value: 'latest' },
					{ name: 'Pre-release continuation (e.g. 1.0.0-alpha.0 -> 1.0.0-alpha.1)', value: 'prerelease' },
					{ name: 'Pre-release promotion (e.g. 1.0.0-alpha.1 -> 1.0.0-beta.0)', value: 'prerelease-promote' }
				]
			} ] );
		} );

		it( 'should handle beta version', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { releaseType: 'latest' } );

			await promptReleaseType( '5.2.1-beta.7' );

			expect( inquirer.prompt ).toHaveBeenCalledWith( [ {
				type: 'list',
				name: 'releaseType',
				message: 'Please select the release type.',
				choices: [
					{ name: 'Latest (stable) release (e.g. 1.0.0-beta.2 -> 1.0.0)', value: 'latest' },
					{ name: 'Pre-release continuation (e.g. 1.0.0-alpha.0 -> 1.0.0-alpha.1)', value: 'prerelease' },
					{ name: 'Pre-release promotion (e.g. 1.0.0-alpha.1 -> 1.0.0-beta.0)', value: 'prerelease-promote' }
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
