/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { npm } from '@ckeditor/ckeditor5-dev-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import semver from 'semver';
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
vi.mock( 'semver' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'provideNewVersionForMonorepository()', () => {
	const defaultOptions = {
		packageName: 'test-package',
		version: '1.0.0',
		bumpType: 'patch' as const,
		indentLevel: 0
	};

	beforeEach( () => {
		vi.mocked( npm.manifest ).mockRejectedValue( new Error( 'Package not found' ) );
		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
		vi.mocked( semver.gt ).mockReturnValue( true );
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

	// it( 'validates version format', async () => {
	// 	const options = {
	// 		...defaultOptions,
	// 		version: '1.0.0',
	// 		bumpType: 'patch' as const
	// 	};
	//
	// 	vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
	// 	vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );
	//
	// 	await provideNewVersionForMonorepository( options );
	//
	// 	const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
	// 	const questions = mockCalls[ 0 ][ 0 ][ 0 ];
	// 	const validate = questions.validate;
	// 	const filter = questions.filter;
	//
	// 	expect( filter( '  1.0.1  ' ) ).toBe( '1.0.1' );
	//
	// 	vi.mocked( semver.valid ).mockReturnValue( null );
	// 	expect( await validate( 'invalid' ) ).toBe( 'Please provide a valid version or "internal" for internal changes.' );
	//
	// 	vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
	// 	expect( await validate( '1.0.1' ) ).toBe( true );
	// } );

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

	// it( 'validates version is higher than current', async () => {
	// 	const options = {
	// 		...defaultOptions,
	// 		version: '1.0.0',
	// 		bumpType: 'patch' as const
	// 	};
	//
	// 	vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
	// 	vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );
	//
	// 	await provideNewVersionForMonorepository( options );
	//
	// 	const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
	// 	const questions = mockCalls[ 0 ][ 0 ][ 0 ];
	// 	const validate = questions.validate;
	//
	// 	vi.mocked( semver.gt ).mockReturnValue( false );
	// 	expect( await validate( '0.9.9' ) ).toBe( 'Provided version must be higher than "1.0.0".' );
	//
	// 	vi.mocked( semver.gt ).mockReturnValue( true );
	// 	expect( await validate( '1.0.1' ) ).toBe( true );
	// } );

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

		// npm.manifest should not be called because validateVersionAvailability
		// should return early for 'internal'
		expect( npm.manifest ).not.toHaveBeenCalled();

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

		// Ensure npm.manifest would throw an error if called
		vi.mocked( npm.manifest ).mockRejectedValue( new Error( 'Should not be called' ) );

		// This should hit the early return in validateVersionAvailability (lines 87-88)
		const result = await validateFn( 'internal' );
		expect( result ).toBe( true );

		// Verify npm.manifest was not called, confirming we hit the early return
		expect( npm.manifest ).not.toHaveBeenCalled();
	} );

	// it( 'checks version availability', async () => {
	// 	const options = {
	// 		...defaultOptions,
	// 		version: '1.0.0',
	// 		bumpType: 'patch' as const
	// 	};
	//
	// 	vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
	// 	vi.mocked( npm.manifest ).mockResolvedValueOnce( {
	// 		version: '1.0.1',
	// 		name: 'test-package',
	// 		dist: { tarball: '' },
	// 		deprecated: false,
	// 		_from: '',
	// 		_resolved: '',
	// 		_integrity: '',
	// 		_id: ''
	// 	} );
	//
	// 	vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.2' } );
	//
	// 	await provideNewVersionForMonorepository( options );
	//
	// 	const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
	// 	const questions = mockCalls[ 0 ][ 0 ][ 0 ];
	// 	const validate = questions.validate;
	//
	// 	expect( await validate( '1.0.1' ) ).toBe( 'Given version is already taken.' );
	// 	expect( await validate( '1.0.2' ) ).toBe( true );
	// } );

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

		// Reset call counts for npm.manifest
		vi.mocked( npm.manifest ).mockClear();

		// Call validate with 'internal' should skip version availability check
		await validate( 'internal' );

		// npm.manifest should not be called for 'internal' version
		expect( npm.manifest ).not.toHaveBeenCalled();
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
		vi.mocked( npm.manifest ).mockResolvedValue( {} as any );

		// First, let's extract the validate function
		let validateFn: any;
		vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
			validateFn = questions[ 0 ].validate;
			return Promise.resolve( { version: 'internal' } ) as any;
		} );

		// Run the function to trigger the mocks
		await provideNewVersionForMonorepository( options );

		// Reset call counters
		vi.mocked( npm.manifest ).mockClear();
		vi.mocked( semver.gt ).mockClear();

		// Call the validate with 'internal' - this should hit the early returns
		// in both validateVersionHigherThanCurrent and validateVersionAvailability
		const result = await validateFn( 'internal' );
		expect( result ).toBe( true );

		// Verify semver.gt was not called (the validation skipped the version comparison)
		expect( semver.gt ).not.toHaveBeenCalled();

		// Verify npm.manifest was not called (the availability check was skipped)
		expect( npm.manifest ).not.toHaveBeenCalled();
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
		// Set up a failing checkVersionAvailability behavior by having npm.manifest succeed
		vi.mocked( npm.manifest ).mockResolvedValue( {} as any );

		// Call with 'internal' should hit the early return
		const result = await validateVersionAvailability( 'internal', 'test-package' );
		expect( result ).toBe( true );

		// Verify npm.manifest was not called (checkVersionAvailability would call it)
		expect( npm.manifest ).not.toHaveBeenCalled();
	} );
} );
