/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { npm } from '@ckeditor/ckeditor5-dev-utils';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import chalk from 'chalk';
import inquirer from 'inquirer';
import semver, { type ReleaseType } from 'semver';
import { provideNewVersion } from '../../src/utils/providenewversion.js';
import { logInfo } from '../../src/utils/loginfo.js';
import { UserAbortError } from '../../src/utils/useraborterror.js';

vi.mock( 'inquirer' );
vi.mock( 'chalk', () => ( {
	default: {
		underline: vi.fn( ( text: string ) => text ),
		cyan: vi.fn( ( text: string ) => text ),
		yellow: vi.fn( ( text: string ) => text ),
		bold: vi.fn( ( text: string ) => text )
	}
} ) );
vi.mock( 'semver' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../src/utils/loginfo.js' );

describe( 'provideNewVersion()', () => {
	const defaultOptions = {
		packageName: 'test-package',
		version: '1.0.0',
		bumpType: 'patch' as ReleaseType,
		indentLevel: 0
	};

	let processMock: MockInstance<typeof process.exit>;

	beforeEach( () => {
		vi.mocked( semver.valid ).mockReturnValue( '1.0.1' );
		vi.mocked( semver.gt ).mockReturnValue( true );
		vi.mocked( semver.inc ).mockReturnValue( '1.0.1' );
		vi.mocked( inquirer.prompt ).mockResolvedValue( { version: '1.0.1' } );

		processMock = vi.spyOn( process, 'exit' ).mockImplementation( ( () => {
		} ) as any );
	} );

	afterEach( () => {
		processMock.mockRestore();
	} );

	describe( 'Version suggestion and prompt configuration', () => {
		it.each( [
			[ '1.0.1', 'patch' ],
			[ '1.1.0', 'minor' ],
			[ '2.0.0', 'major' ]
		] )(
			'should suggest version "%s" for bumpType "%s"',
			async ( expectedVersion, bumpType ) => {
				const options = {
					...defaultOptions,
					bumpType: bumpType as ReleaseType
				};

				vi.mocked( semver.inc ).mockReturnValueOnce( expectedVersion );
				vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: expectedVersion } );

				const result = await provideNewVersion( options as any );

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

			await provideNewVersion( options as any );

			const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
			const question = mockCalls[ 0 ][ 0 ][ 0 ];

			expect( question.default ).toBe( currentVersion );
			expect( question.message ).toContain( `suggested: "${ currentVersion }"` );
		} );

		it.each( [ 0, 1, 2, 3 ] )(
			'should apply indentation for indentLevel=%i',
			async indentLevel => {
				const options = {
					...defaultOptions,
					indentLevel
				};

				vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: '1.0.1' } );

				await provideNewVersion( options as any );

				const mockCalls = vi.mocked( inquirer.prompt ).mock.calls as any;
				const question = mockCalls[ mockCalls.length - 1 ][ 0 ][ 0 ];

				// CLI_INDENT_SIZE is 3
				const expectedIndent = ' '.repeat( indentLevel * 3 );
				expect( question.prefix ).toBe( `${ expectedIndent }?` );
			}
		);

		it( 'should trim input values', async () => {
			let filterFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				filterFunction = questions[ 0 ].filter;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersion( defaultOptions as any );

			expect( filterFunction ).toBeDefined();
			expect( filterFunction( '  1.0.1  ' ) ).toBe( '1.0.1' );
			expect( filterFunction( ' internal ' ) ).toBe( 'internal' );
		} );

		it( 'should display a warning when found invalid changes', async () => {
			vi.mocked( inquirer.prompt )
				.mockImplementationOnce( () => {
					return Promise.resolve( { continue: false } ) as any;
				} );

			await expect( provideNewVersion( {
				...defaultOptions,
				displayValidationWarning: true
			} ) ).rejects.toThrow( UserAbortError );

			expect( vi.mocked( chalk.bold ) ).toHaveBeenCalled();
			expect( vi.mocked( chalk.underline ) ).toHaveBeenCalled();
			expect( vi.mocked( chalk.yellow ) ).toHaveBeenCalled();
			expect( vi.mocked( logInfo ) ).toHaveBeenCalledWith(
				expect.stringContaining( 'WARNING: Invalid changes detected!' )
			);
			expect( vi.mocked( logInfo ) ).toHaveBeenCalledWith(
				'You can cancel the process, fix the invalid files, and run the tool again.'
			);
			expect( vi.mocked( logInfo ) ).toHaveBeenCalledWith(
				'Alternatively, you can continue - but invalid values will be lost.'
			);
		} );

		it( 'should ask about the next version when user accepts the invalid changes', async () => {
			vi.mocked( inquirer.prompt )
				.mockImplementationOnce( () => {
					return Promise.resolve( { continue: true } ) as any;
				} )
				.mockResolvedValueOnce( { version: '2.0.0' } );

			const result = await provideNewVersion( {
				...defaultOptions,
				displayValidationWarning: true
			} );

			expect( result ).toBe( '2.0.0' );
		} );
	} );

	describe( 'Version validation', () => {
		let validateFunction: any;

		beforeEach( async () => {
			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersion( defaultOptions as any );
		} );

		it( 'should resolve an error text when passed an invalid format', async () => {
			vi.mocked( semver.valid ).mockReturnValueOnce( null );

			await expect( validateFunction( 'invalid' ) ).resolves
				.toBe( 'Please provide a valid version or "internal" for internal changes.' );
		} );

		it( 'should resolve true when a version follows the semver standard', async () => {
			vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );
			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );

			await expect( validateFunction( '1.0.1' ) ).resolves
				.toBe( true );
		} );

		it( 'should resolved true when passing `internal` as version', async () => {
			const result = await validateFunction( 'internal' );

			expect( result ).toBe( true );
			expect( semver.valid ).not.toHaveBeenCalled();
		} );

		it( 'should resolve an error text when the specified version is not higher then the current one', async () => {
			vi.mocked( semver.gt ).mockReturnValueOnce( false );
			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.0' );

			await expect( validateFunction( '1.0.0' ) ).resolves
				.toBe( 'Provided version must be higher than "1.0.0".' );
		} );

		it( 'should resolve an error text when the provided version is higher then the current one but already taken', async () => {
			vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( false );
			vi.mocked( semver.gt ).mockReturnValueOnce( true );
			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );

			await expect( validateFunction( '1.0.1' ) ).resolves
				.toBe( 'Given version is already taken.' );
		} );

		it( 'should resolve true when the provided version is higher then the current and it is available', async () => {
			vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );
			vi.mocked( semver.gt ).mockReturnValueOnce( true );
			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );

			await expect( validateFunction( '1.0.1' ) ).resolves.toBe( true );
		} );
	} );

	describe( 'Function return value', () => {
		it.each( [
			'1.0.1',
			'1.1.0',
			'2.0.0',
			'internal'
		] )( 'should return the version selected by the user: "%s"', async userVersion => {
			vi.mocked( inquirer.prompt ).mockResolvedValueOnce( { version: userVersion } );

			const result = await provideNewVersion( defaultOptions as any );

			expect( result ).toBe( userVersion );
		} );
	} );

	describe( 'Error handling', () => {
		it( 'should propagate errors from npm.checkVersionAvailability', async () => {
			let validateFunction: any;

			vi.mocked( inquirer.prompt ).mockImplementationOnce( ( questions: any ) => {
				validateFunction = questions[ 0 ].validate;
				return Promise.resolve( { version: '1.0.1' } ) as any;
			} );

			await provideNewVersion( defaultOptions as any );

			vi.mocked( semver.valid ).mockReturnValueOnce( '1.0.1' );
			vi.mocked( semver.gt ).mockReturnValueOnce( true );
			vi.mocked( npm.checkVersionAvailability ).mockRejectedValueOnce( new Error( 'Network error' ) );

			await expect( validateFunction( '1.0.1' ) ).rejects.toThrow( 'Network error' );
		} );

		it( 'should handle rejection from inquirer.prompt', async () => {
			vi.mocked( inquirer.prompt ).mockRejectedValueOnce( new Error( 'User canceled' ) );

			await expect( provideNewVersion( defaultOptions as any ) ).rejects.toThrow( 'User canceled' );
		} );
	} );
} );
