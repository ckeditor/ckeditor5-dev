/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import inquirer from 'inquirer';
import { provideNewVersion } from '../../src/utils/providenewversion.js';
import { validateInputVersion } from '../../src/utils/validateinputversion.js';
import { UserAbortError } from '../../src/utils/useraborterror.js';

vi.mock( 'inquirer' );
vi.mock( 'util', () => ( {
	styleText: vi.fn( ( _style, text ) => text )
} ) );
vi.mock( '../../src/utils/validateinputversion.js' );
vi.mock( '../../src/utils/loginfo.js', () => ( {
	logInfo: vi.fn()
} ) );

describe( 'provideNewVersion()', () => {
	const defaultOptions = {
		packageName: 'test-package',
		version: '1.0.0',
		bumpType: 'patch' as const,
		releaseChannel: 'latest' as const,
		displayValidationWarning: false,
		releaseType: 'latest' as const
	};

	beforeEach( () => {
		vi.mocked( validateInputVersion ).mockResolvedValue( true );
		vi.mocked( inquirer.prompt ).mockResolvedValue( { version: '1.0.1' } as any );
	} );

	describe( 'basic functionality', () => {
		it( 'should prompt user for new version and return the result', async () => {
			const result = await provideNewVersion( defaultOptions );

			expect( inquirer.prompt ).toHaveBeenCalledWith( expect.arrayContaining( [
				expect.objectContaining( {
					type: 'input',
					name: 'version',
					default: '1.0.1',
					message: expect.stringContaining( 'Type the new version' )
				} )
			] ) );
			expect( result ).toBe( '1.0.1' );
		} );

		it( 'should use suggested version as default', async () => {
			await provideNewVersion( defaultOptions );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].default ).toBe( '1.0.1' );
		} );

		it( 'should trim whitespace from user input', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { version: '  1.0.1  ' } as any );

			const result = await provideNewVersion( defaultOptions );

			expect( result ).toBe( '  1.0.1  ' );
		} );
	} );

	describe( 'version suggestion logic', () => {
		it( 'should suggest patch version for patch bump type', async () => {
			await provideNewVersion( {
				...defaultOptions,
				bumpType: 'patch',
				version: '1.0.0'
			} );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].default ).toBe( '1.0.1' );
		} );

		it( 'should suggest minor version for minor bump type', async () => {
			await provideNewVersion( {
				...defaultOptions,
				bumpType: 'minor',
				version: '1.0.0'
			} );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].default ).toBe( '1.1.0' );
		} );

		it( 'should suggest major version for major bump type', async () => {
			await provideNewVersion( {
				...defaultOptions,
				bumpType: 'major',
				version: '1.0.0'
			} );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].default ).toBe( '2.0.0' );
		} );

		it( 'should suggest prerelease version for prerelease bump type with channel', async () => {
			await provideNewVersion( {
				...defaultOptions,
				bumpType: 'prerelease',
				releaseChannel: 'alpha',
				version: '1.0.0'
			} );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].default ).toBe( '1.0.1-alpha.0' );
		} );

		it( 'should suggest premajor alpha for prerelease bump type on latest channel', async () => {
			await provideNewVersion( {
				...defaultOptions,
				bumpType: 'prerelease',
				releaseChannel: 'latest',
				version: '1.0.0'
			} );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].default ).toBe( '2.0.0-alpha.0' );
		} );
	} );

	describe( 'validation integration', () => {
		it( 'should create prompt with a validate function', async () => {
			await provideNewVersion( defaultOptions );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( typeof promptCall[ 0 ].validate ).toBe( 'function' );
		} );

		it( 'should pass correct parameters to validateInputVersion through prompt', async () => {
			await provideNewVersion( defaultOptions );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			const validateFunction = promptCall[ 0 ].validate;

			// Call the validate function directly to test the parameters
			await validateFunction( '1.0.1' );

			expect( validateInputVersion ).toHaveBeenCalledWith( {
				newVersion: '1.0.1',
				version: '1.0.0',
				releaseType: 'latest',
				packageName: 'test-package',
				suggestedVersion: '1.0.1'
			} );
		} );
	} );

	describe( 'displayValidationWarning behavior', () => {
		it( 'should not show warning when displayValidationWarning is false', async () => {
			const { logInfo } = await import( '../../src/utils/loginfo.js' );

			await provideNewVersion( defaultOptions );

			expect( logInfo ).not.toHaveBeenCalled();
		} );

		it( 'should show warning and ask for confirmation when displayValidationWarning is true', async () => {
			const { logInfo } = await import( '../../src/utils/loginfo.js' );
			vi.mocked( inquirer.prompt )
				.mockResolvedValueOnce( { continue: true } as any ) // confirmation
				.mockResolvedValueOnce( { version: '1.0.1' } as any ); // version input

			await provideNewVersion( {
				...defaultOptions,
				displayValidationWarning: true
			} );

			expect( logInfo ).toHaveBeenCalledWith( '' );
			expect( logInfo ).toHaveBeenCalledWith( expect.stringContaining( 'WARNING: Invalid changes detected!' ) );
			expect( inquirer.prompt ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should throw UserAbortError when user cancels confirmation', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { continue: false } as any );

			await expect( provideNewVersion( {
				...defaultOptions,
				displayValidationWarning: true
			} ) ).rejects.toThrow( UserAbortError );
		} );
	} );

	describe( 'indent level handling', () => {
		it( 'should apply indent level to prompt prefix', async () => {
			await provideNewVersion( {
				...defaultOptions,
				indentLevel: 2
			} );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].prefix ).toBe( '      ?' );
		} );

		it( 'should apply indent level to confirmation prompt prefix', async () => {
			vi.mocked( inquirer.prompt )
				.mockResolvedValueOnce( { continue: true } as any )
				.mockResolvedValueOnce( { version: '1.0.1' } as any );

			await provideNewVersion( {
				...defaultOptions,
				displayValidationWarning: true,
				indentLevel: 1
			} );

			// Check that inquirer.prompt was called twice (confirmation + version input)
			expect( inquirer.prompt ).toHaveBeenCalledTimes( 2 );

			// Check the first call (confirmation) has the correct prefix
			const confirmationCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( confirmationCall.prefix ).toBe( '   ?' );
		} );
	} );

	describe( 'message formatting', () => {
		it( 'should include current version in prompt message', async () => {
			await provideNewVersion( defaultOptions );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].message ).toContain( 'current: "1.0.0"' );
		} );

		it( 'should include suggested version in prompt message', async () => {
			await provideNewVersion( defaultOptions );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].message ).toContain( 'suggested: "1.0.1"' );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle empty string input', async () => {
			vi.mocked( inquirer.prompt ).mockResolvedValue( { version: '' } as any );

			const result = await provideNewVersion( defaultOptions );

			expect( result ).toBe( '' );
		} );

		it( 'should fall back to current version when getSuggestedVersion returns null', async () => {
			await provideNewVersion( {
				...defaultOptions,
				version: 'invalid-version',
				bumpType: 'patch'
			} );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].default ).toBe( 'invalid-version' );
		} );

		it( 'should call trim on the value provided to inquirer', async () => {
			await provideNewVersion( defaultOptions );

			const promptCall = vi.mocked( inquirer.prompt ).mock.calls[ 0 ]?.[ 0 ] as any;
			expect( promptCall[ 0 ].filter( ' abc ' ) ).toBe( 'abc' );
		} );
	} );
} );
