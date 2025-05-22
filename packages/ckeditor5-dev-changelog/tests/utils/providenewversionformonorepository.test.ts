/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { npm } from '@ckeditor/ckeditor5-dev-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import semver, { type ReleaseType } from 'semver';
import {
	provideNewVersionForMonorepository
} from '../../src/utils/providenewversionformonorepository.js';

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
		bumpType: 'patch' as ReleaseType,
		indentLevel: 0
	};

	beforeEach( () => {
		vi.mocked( npm.manifest ).mockRejectedValue( new Error( 'Package not found' ) );
		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );
		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
		vi.mocked( semver.gt ).mockReturnValue( true );
		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValue( { version: '1.0.1' } );
	} );

	describe( 'Version suggestion and prompt configuration', () => {
		it.each( [
			{ bumpType: 'patch', expectedVersion: '1.0.1' },
			{ bumpType: 'minor', expectedVersion: '1.1.0' },
			{ bumpType: 'major', expectedVersion: '2.0.0' },
		] )(
			'should suggest version for bumpType="$bumpType"',
			async ( { bumpType, expectedVersion } ) => {
				const options = {
					...defaultOptions,
					bumpType: bumpType as ReleaseType,
				};

				vi.mocked( semver.inc ).mockReturnValueOnce( expectedVersion );
				vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: expectedVersion } );

				const result = await provideNewVersionForMonorepository( options as any );

				expect( result ).toBe( expectedVersion );
				expect( semver.inc ).toHaveBeenCalledWith( '1.0.0', bumpType );

				const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
				const question = mockCalls[ mockCalls.length - 1 ][ 0 ][ 0 ];

				expect( question.default ).toBe( expectedVersion );
				expect( question.message ).toContain( `suggested: "${ expectedVersion }"` );
			}
		);

		it( 'should use current version as default when semver.inc returns null', async () => {
			const currentVersion = '1.0.0';
			const options = {
				...defaultOptions,
				version: currentVersion
			};

			vi.mocked( semver.inc ).mockReturnValueOnce( null );
			vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: currentVersion } );

			await provideNewVersionForMonorepository( options as any );

			const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
			const question = mockCalls[ 0 ][ 0 ][ 0 ];

			expect( question.default ).toBe( currentVersion );
			expect( question.message ).toContain( `suggested: "${ currentVersion }"` );
		} );

		it( 'should apply indentation based on indentLevel option', async () => {
			const indentLevels = [ 0, 1, 2, 3 ];

			for ( const indentLevel of indentLevels ) {
				const options = {
					...defaultOptions,
					indentLevel
				};

				vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

				await provideNewVersionForMonorepository( options as any );

				const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
				const question = mockCalls[ mockCalls.length - 1 ][ 0 ][ 0 ];

				// CLI_INDENT_SIZE is 3 as defined in the implementation
				const expectedIndent = ' '.repeat( indentLevel * 3 );
				expect( question.prefix ).toBe( `${ expectedIndent }?` );
			}
		} );

		it( 'should trim input values', async () => {
			let filterFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				filterFunction = questions[ 0 ].filter;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			expect( filterFunction ).toBeDefined();
			expect( filterFunction( '  1.0.1  ' ) ).toBe( '1.0.1' );
			expect( filterFunction( ' internal ' ) ).toBe( 'internal' );
		} );
	} );

	describe( 'Version validation', () => {
		it( 'should validate version format', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			vi.mocked( semver.valid ).mockReturnValueOnce( null );
			const invalidResult = await validateFunction( 'invalid' );
			expect( invalidResult ).toBe( 'Please provide a valid version or "internal" for internal changes.' );

			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );
			const validResult = await validateFunction( '1.0.1' );
			expect( validResult ).toBe( true );
		} );

		it( 'should accept "internal" as a special version', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: 'internal' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			vi.mocked( semver.valid ).mockClear();

			const result = await validateFunction( 'internal' );

			expect( result ).toBe( true );
			expect( semver.valid ).not.toHaveBeenCalled();
		} );

		it( 'should validate version is higher than current', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			vi.mocked( semver.valid ).mockReturnValueOnce( '0.9.9' );
			vi.mocked( semver.gt ).mockReturnValueOnce( false );
			const lowerResult = await validateFunction( '0.9.9' );
			expect( lowerResult ).toBe( 'Provided version must be higher than "1.0.0".' );

			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );
			vi.mocked( semver.gt ).mockReturnValueOnce( true );
			const higherResult = await validateFunction( '1.0.1' );
			expect( higherResult ).toBe( true );
		} );

		it( 'should bypass version comparison for "internal" version', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: 'internal' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			vi.mocked( semver.gt ).mockClear();

			const result = await validateFunction( 'internal' );

			expect( result ).toBe( true );
			expect( semver.gt ).not.toHaveBeenCalled();
		} );

		it( 'should check version availability in npm registry', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );
			vi.mocked( semver.gt ).mockReturnValueOnce( true );
			vi.mocked( npm.checkVersionAvailability ).mockResolvedValueOnce( false );

			const unavailableResult = await validateFunction( '1.0.1' );
			expect( unavailableResult ).toBe( 'Given version is already taken.' );

			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.2' );
			vi.mocked( semver.gt ).mockReturnValueOnce( true );
			vi.mocked( npm.checkVersionAvailability ).mockResolvedValueOnce( true );

			const availableResult = await validateFunction( '1.0.2' );
			expect( availableResult ).toBe( true );
		} );

		it( 'should bypass availability check for "internal" version', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: 'internal' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			vi.mocked( npm.checkVersionAvailability ).mockClear();

			const result = await validateFunction( 'internal' );

			expect( result ).toBe( true );
			expect( npm.checkVersionAvailability ).not.toHaveBeenCalled();
		} );

		it( 'should run all validations in sequence for normal versions', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			vi.mocked( semver.valid ).mockClear();
			vi.mocked( semver.gt ).mockClear();
			vi.mocked( npm.checkVersionAvailability ).mockClear();

			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );
			vi.mocked( semver.gt ).mockReturnValueOnce( true );
			vi.mocked( npm.checkVersionAvailability ).mockResolvedValueOnce( true );

			const result = await validateFunction( '1.0.1' );

			expect( result ).toBe( true );
			expect( semver.valid ).toHaveBeenCalledTimes( 1 );
			expect( semver.gt ).toHaveBeenCalledTimes( 1 );
			expect( npm.checkVersionAvailability ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Function return value', () => {
		it( 'should return the version selected by the user', async () => {
			const userInputVersions = [ '1.0.1', '1.1.0', '2.0.0', 'internal' ];

			for ( const userVersion of userInputVersions ) {
				vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: userVersion } );

				const result = await provideNewVersionForMonorepository( defaultOptions as any );

				expect( result ).toBe( userVersion );
			}
		} );
	} );

	describe( 'Error handling', () => {
		it( 'should propagate errors from npm.checkVersionAvailability', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersionForMonorepository( defaultOptions as any );

			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );
			vi.mocked( semver.gt ).mockReturnValueOnce( true );
			vi.mocked( npm.checkVersionAvailability ).mockRejectedValueOnce( new Error( 'Network error' ) );

			await expect( validateFunction( '1.0.1' ) ).rejects.toThrow( 'Network error' );
		} );

		it( 'should handle rejection from inquirer.prompt', async () => {
			vi.mocked( inquirer.prompt ).mockRejectedValueOnce( new Error( 'User canceled' ) );

			await expect( provideNewVersionForMonorepository( defaultOptions as any ) ).rejects.toThrow( 'User canceled' );
		} );
	} );
} );
