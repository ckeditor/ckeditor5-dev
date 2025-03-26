/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideNewVersionForMonoRepository } from '../../src/utils/providenewversionformonorepository.js';
import inquirer from 'inquirer';
import pacote from 'pacote';
import semver from 'semver';

vi.mock( 'inquirer' );
vi.mock( 'chalk', () => ( {
	default: {
		underline: ( text: string ) => text,
		cyan: ( text: string ) => text
	}
} ) );
vi.mock( 'pacote', () => ( {
	default: {
		manifest: vi.fn()
	}
} ) );
vi.mock( '../../src/utils/loginfo.js', () => ( {
	logInfo: vi.fn()
} ) );
vi.mock( 'semver', () => ( {
	default: {
		inc: vi.fn(),
		valid: vi.fn(),
		gt: vi.fn()
	}
} ) );

describe( 'provideNewVersionForMonoRepository()', () => {
	const defaultOptions = {
		packageName: 'test-package',
		version: '1.0.0',
		bumpType: 'patch' as const,
		indentLevel: 0
	};

	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( pacote.manifest ).mockRejectedValue( new Error( 'Package not found' ) );
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

		await provideNewVersionForMonoRepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		expect( questions.default ).toBe( '1.0.1' );
	} );

	it( 'falls back to current version when semver.inc returns null', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( null );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.0' } );

		await provideNewVersionForMonoRepository( options );

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

		await provideNewVersionForMonoRepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		const validate = questions.validate;
		const filter = questions.filter;

		expect( filter( '  1.0.1  ' ) ).toBe( '1.0.1' );

		vi.mocked( semver.valid ).mockReturnValue( false as any );
		expect( await validate( 'invalid' ) ).toBe( 'Please provide a valid version.' );

		vi.mocked( semver.valid ).mockReturnValue( true as any );
		expect( await validate( '1.0.1' ) ).toBe( true );
	} );

	it( 'validates version is higher than current', async () => {
		const options = {
			...defaultOptions,
			version: '1.0.0',
			bumpType: 'patch' as const
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

		await provideNewVersionForMonoRepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		const validate = questions.validate;

		vi.mocked( semver.gt ).mockReturnValue( false );
		expect( await validate( '0.9.9' ) ).toBe( 'Provided version must be higher than "1.0.0".' );

		vi.mocked( semver.gt ).mockReturnValue( true );
		expect( await validate( '1.0.1' ) ).toBe( true );
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

		await provideNewVersionForMonoRepository( options );

		const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
		const questions = mockCalls[ 0 ][ 0 ][ 0 ];
		const validate = questions.validate;

		expect( await validate( '1.0.1' ) ).toBe( 'Given version is already taken.' );
		expect( await validate( '1.0.2' ) ).toBe( true );
	} );

	it( 'applies correct indentation', async () => {
		const options = {
			...defaultOptions,
			indentLevel: 2
		};

		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

		await provideNewVersionForMonoRepository( options );

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

		const result = await provideNewVersionForMonoRepository( options );
		expect( result ).toBe( '1.0.1' );
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

			const result = await provideNewVersionForMonoRepository( options );
			expect( result ).toBe( expected );
		}
	} );
} );
