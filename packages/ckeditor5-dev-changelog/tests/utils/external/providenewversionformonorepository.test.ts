/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import pacote from 'pacote';
import semver from 'semver';
import os from 'os';
import upath from 'upath';
import crypto from 'crypto';
import fs from 'fs-extra';
import {
	provideNewVersionForMonorepository,
	validateVersionHigherThanCurrent,
	validateVersionAvailability
} from '../../../src/utils/external/providenewversionformonorepository.js';

vi.mock( 'inquirer' );
vi.mock( 'chalk', () => ( {
	default: {
		underline: ( text: string ) => text,
		cyan: ( text: string ) => text
	}
} ) );
vi.mock( 'pacote' );
vi.mock( '../../src/utils/loginfo.js' );
vi.mock( 'semver' );
vi.mock( 'fs-extra' );
vi.mock( 'crypto' );

describe( 'provideNewVersionForMonorepository()', () => {
	const defaultOptions = {
		packageName: 'test-package',
		version: '1.0.0',
		bumpType: 'patch' as const,
		indentLevel: 0
	};

	beforeEach( () => {
		vi.mocked( pacote.manifest ).mockRejectedValue( new Error( 'Package not found' ) );
		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
		vi.mocked( semver.gt ).mockReturnValue( true );
		vi.mocked( crypto.randomUUID ).mockReturnValue( '00000000-0000-0000-0000-000000000000' );
		vi.mocked( fs.ensureDir ).mockResolvedValue( undefined );
		vi.mocked( fs.remove ).mockResolvedValue( undefined );
	} );

	it( 'suggests correct version based on bump type', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

		await provideNewVersionForMonorepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		expect( questions.default ).toBe( '1.0.1' );
		expect( questions.message ).toContain( 'suggested: "1.0.1"' );
		expect( questions.message ).toContain( 'or "internal" for internal changes' );
	} );

	it( 'falls back to current version when semver.inc returns null', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( null );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.0' } );

		await provideNewVersionForMonorepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		expect( questions.default ).toBe( '1.0.0' );
	} );

	it( 'validates version format', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

		await provideNewVersionForMonorepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		const validate = questions.validate;
		const filter = questions.filter;

		expect( filter( '  1.0.1  ' ) ).toBe( '1.0.1' );

		vi.mocked( semver.valid ).mockReturnValue( null );
		expect( await validate( 'invalid' ) ).toBe( 'Please provide a valid version or "internal" for internal changes.' );

		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
		expect( await validate( '1.0.1' ) ).toBe( true );
	} );

	it( 'validates "internal" as a valid special version', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: 'internal' } );

		await provideNewVersionForMonorepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		const validate = questions.validate;

		expect( await validate( 'internal' ) ).toBe( true );
	} );

	it( 'validates version is higher than current', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

		await provideNewVersionForMonorepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		const validate = questions.validate;

		vi.mocked( semver.gt ).mockReturnValue( false );
		expect( await validate( '0.9.9' ) ).toBe( 'Provided version must be higher than "1.0.0".' );

		vi.mocked( semver.gt ).mockReturnValue( true );
		expect( await validate( '1.0.1' ) ).toBe( true );
	} );

	it( 'covers all validation steps with "internal" version', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		// We'll extract the validate function to directly test it
		let validateFn: any;

		// Mock inquirer.prompt to extract the validate function
		vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
			validateFn = questions[ 0 ].validate;
			return Promise.resolve( { version: 'internal' } ) as any;
		} );

		await provideNewVersionForMonorepository( options );

		// Ensure we have the validate function
		expect( validateFn ).toBeDefined();

		// Ensure the mocks are set up to fail for normal validation
		// so we can verify the early returns are working
		vi.mocked( semver.gt ).mockReturnValue( false );
		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );

		// These should work because of the early returns in validateVersionHigherThanCurrent
		// and validateVersionAvailability (lines 70-72 and 86-88)
		const result = await validateFn( 'internal' );
		expect( result ).toBe( true );

		// pacote.manifest should not be called because validateVersionAvailability
		// should return early for 'internal'
		expect( pacote.manifest ).not.toHaveBeenCalled();

		// semver.gt should not be called because validateVersionHigherThanCurrent
		// should return early for 'internal'
		expect( semver.gt ).not.toHaveBeenCalled();
	} );

	it( 'bypasses higher version check for "internal" version', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		let validateFn: any;
		vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
			validateFn = questions[ 0 ].validate;
			return Promise.resolve( { version: 'internal' } ) as any;
		} );

		await provideNewVersionForMonorepository( options );

		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
		vi.mocked( semver.gt ).mockReturnValue( false ); // This would fail for normal versions

		// This should hit the early return in validateVersionHigherThanCurrent (lines 71-72)
		const result = await validateFn( 'internal' );
		expect( result ).toBe( true );
		expect( semver.gt ).not.toHaveBeenCalled();
	} );

	it( 'bypasses version availability check for "internal" version', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		let validateFn: any;
		vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
			validateFn = questions[ 0 ].validate;
			return Promise.resolve( { version: 'internal' } ) as any;
		} );

		await provideNewVersionForMonorepository( options );

		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
		vi.mocked( semver.gt ).mockReturnValue( true );

		// Ensure pacote.manifest would throw an error if called
		vi.mocked( pacote.manifest ).mockRejectedValue( new Error( 'Should not be called' ) );

		// This should hit the early return in validateVersionAvailability (lines 87-88)
		const result = await validateFn( 'internal' );
		expect( result ).toBe( true );

		// Verify pacote.manifest was not called, confirming we hit the early return
		expect( pacote.manifest ).not.toHaveBeenCalled();
	} );

	it( 'checks version availability', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( pacote.manifest ).mockResolvedValueOnce( {
			version: '1.0.1',
			name: 'test-package',
			dist: { tarball: '' },
			deprecated: false,
			_from: '',
			_resolved: '',
			_integrity: '',
			_id: ''
		} );

		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.2' } );

		await provideNewVersionForMonorepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		const validate = questions.validate;

		expect( await validate( '1.0.1' ) ).toBe( 'Given version is already taken.' );
		expect( await validate( '1.0.2' ) ).toBe( true );
	} );

	it( 'skips availability validation for "internal" version', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: 'internal' } );

		await provideNewVersionForMonorepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		const validate = questions.validate;

		// Reset call counts for pacote.manifest
		vi.mocked( pacote.manifest ).mockClear();

		// Call validate with 'internal' should skip version availability check
		await validate( 'internal' );

		// pacote.manifest should not be called for 'internal' version
		expect( pacote.manifest ).not.toHaveBeenCalled();
	} );

	it( 'applies correct indentation', async () => {
		const options = {
			...defaultOptions,
			indentLevel: 2
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

		await provideNewVersionForMonorepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		expect( questions.prefix ).toBe( '      ?' );
	} );

	it( 'returns the provided version', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

		const result = await provideNewVersionForMonorepository( options );
		expect( result ).toBe( '1.0.1' );
	} );

	it( 'returns "internal" when that is selected', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: 'internal' } );

		const result = await provideNewVersionForMonorepository( options );
		expect( result ).toBe( 'internal' );
	} );

	it( 'handles different bump types correctly', async () => {
		const testCases = [
			{ bumpType: 'patch' as const, version: '1.0.0', expected: '1.0.1' },
			{ bumpType: 'minor' as const, version: '1.0.0', expected: '1.1.0' },
			{ bumpType: 'major' as const, version: '1.0.0', expected: '2.0.0' }
		];

		for ( const { bumpType, version, expected } of testCases ) {
			const options = {
				...defaultOptions,
				version,
				bumpType
			};

			vi.mocked( semver.inc ).mockReturnValue( expected );
			vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: expected } );

			const result = await provideNewVersionForMonorepository( options );
			expect( result ).toBe( expected );
		}
	} );

	describe( 'cacheLessPacoteFactory', () => {
		// Test the creation and cleanup of cache directory for the cacheLessPacoteFactory function

		it( 'creates a temporary cache directory and cleans it up when successful', async () => {
			const expectedCacheDir = upath.join( os.tmpdir(), 'pacote--00000000-0000-0000-0000-000000000000' );

			// Setup mocks for a successful version validation
			vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );

			// Mock inquirer.prompt to call our validate function
			vi.mocked( inquirer.prompt ).mockImplementation( ( questions: any ) => {
				// Extract the validate function and call it to trigger cacheLessPacoteFactory
				const validateFn = questions[ 0 ].validate;
				validateFn( '1.0.1' ).catch( () => { /* Ignore errors */ } );

				// Return a resolved promise with our desired result
				return Promise.resolve( { version: '1.0.2' } ) as any;
			} );

			// The original implementation of pacote.manifest is replaced with our own
			const originalManifest = vi.mocked( pacote.manifest );

			// Define a custom manifest implementation that verifies the cache directory
			vi.mocked( pacote.manifest ).mockImplementation( async ( description, options ) => {
				// Verify the cache directory is being used
				expect( options ).toBeDefined();
				expect( options?.cache ).toBe( expectedCacheDir );

				// Simulate a successful manifest call for 1.0.1 (version exists)
				if ( description === 'test-package@1.0.1' ) {
					return {
						version: '1.0.1',
						name: 'test-package',
						dist: { tarball: '' },
						deprecated: false,
						_from: '',
						_resolved: '',
						_integrity: '',
						_id: ''
					};
				}

				// For other versions, throw "not found"
				throw new Error( 'Package not found' );
			} );

			// Trigger the validation process
			await provideNewVersionForMonorepository( {
				...defaultOptions,
				version: '1.0.0'
			} );

			// Verify the fs operations were called with the expected cache directory
			expect( fs.ensureDir ).toHaveBeenCalledWith( expectedCacheDir );
			expect( fs.remove ).toHaveBeenCalledWith( expectedCacheDir );

			// Restore the original mock
			vi.mocked( pacote.manifest ).mockImplementation( originalManifest );
		} );

		it( 'cleans up the temporary directory even when an error occurs', async () => {
			const expectedCacheDir = upath.join( os.tmpdir(), 'pacote--00000000-0000-0000-0000-000000000000' );

			// Setup semver.inc mock for a valid version bump
			vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );

			// Mock inquirer.prompt to call our validate function
			vi.mocked( inquirer.prompt ).mockImplementation( ( questions: any ) => {
				// Extract the validate function and call it to trigger cacheLessPacoteFactory
				const validateFn = questions[ 0 ].validate;
				validateFn( '1.0.1' ).catch( () => { /* Ignore errors */ } );

				// Return a resolved promise with our desired result
				return Promise.resolve( { version: '1.0.2' } ) as any;
			} );

			// Replace the pacote.manifest implementation with one that throws an error
			const originalManifest = vi.mocked( pacote.manifest );
			vi.mocked( pacote.manifest ).mockImplementation( async ( description, options ) => {
				// Verify the cache directory is being used
				expect( options ).toBeDefined();
				expect( options?.cache ).toBe( expectedCacheDir );

				// Always throw an error to test cleanup on failure
				throw new Error( 'Test error' );
			} );

			// Trigger the validation process which uses our manifest function
			await provideNewVersionForMonorepository( {
				...defaultOptions,
				version: '1.0.0'
			} );

			// Verify the fs operations were still called for the cache directory
			expect( fs.ensureDir ).toHaveBeenCalledWith( expectedCacheDir );
			expect( fs.remove ).toHaveBeenCalledWith( expectedCacheDir );

			// Restore the original mock
			vi.mocked( pacote.manifest ).mockImplementation( originalManifest );
		} );
	} );

	it( 'directly tests internal validation functions with "internal" version', async () => {
		// Skip messing with Function constructor and internal functions
		// Instead, just test the final inquirer validation functions more directly

		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		// Set up mocks to definitely fail if normal validation would be attempted
		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
		vi.mocked( semver.gt ).mockReturnValue( false );
		vi.mocked( pacote.manifest ).mockResolvedValue( {} as any );

		// First, let's extract the validate function
		let validateFn: any;
		vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
			validateFn = questions[ 0 ].validate;
			return Promise.resolve( { version: 'internal' } ) as any;
		} );

		// Run the function to trigger the mocks
		await provideNewVersionForMonorepository( options );

		// Reset call counters
		vi.mocked( pacote.manifest ).mockClear();
		vi.mocked( semver.gt ).mockClear();

		// Call the validate with 'internal' - this should hit the early returns
		// in both validateVersionHigherThanCurrent and validateVersionAvailability
		const result = await validateFn( 'internal' );
		expect( result ).toBe( true );

		// Verify semver.gt was not called (the validation skipped the version comparison)
		expect( semver.gt ).not.toHaveBeenCalled();

		// Verify pacote.manifest was not called (the availability check was skipped)
		expect( pacote.manifest ).not.toHaveBeenCalled();
	} );
} );

describe( 'validateVersionHigherThanCurrent()', () => {
	it( 'returns true for "internal" version', () => {
		// Set up semver.gt to fail (which would normally return an error)
		vi.mocked( semver.gt ).mockReturnValue( false );

		// Call with 'internal' should hit the early return
		const result = validateVersionHigherThanCurrent( 'internal', '1.0.0' );
		expect( result ).toBe( true );

		// Verify semver.gt was not called
		expect( semver.gt ).not.toHaveBeenCalled();
	} );
} );

describe( 'validateVersionAvailability()', () => {
	it( 'returns true for "internal" version', async () => {
		// Set up a failing checkVersionAvailability behavior by having pacote.manifest succeed
		vi.mocked( pacote.manifest ).mockResolvedValue( {} as any );

		// Call with 'internal' should hit the early return
		const result = await validateVersionAvailability( 'internal', 'test-package' );
		expect( result ).toBe( true );

		// Verify pacote.manifest was not called (checkVersionAvailability would call it)
		expect( pacote.manifest ).not.toHaveBeenCalled();
	} );
} );
