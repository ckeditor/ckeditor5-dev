/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { determineNextVersion, type DetermineNextVersionOptions } from '../../src/utils/determinenextversion.js';
import { provideNewVersion } from '../../src/utils/providenewversion.js';
import { logInfo } from '../../src/utils/loginfo.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import chalk from 'chalk';
import semver from 'semver';
import type { Entry, SectionsWithEntries } from '../../src/types.js';

vi.mock( '../../src/utils/providenewversion.js' );
vi.mock( '../../src/utils/loginfo.js' );
vi.mock( 'semver', () => {
	return {
		default: {
			inc: vi.fn()
		}
	};
} );

describe( 'determineNextVersion()', () => {
	let options: DetermineNextVersionOptions;
	const mockedProvideNewVersion = vi.mocked( provideNewVersion );
	const mockedLogInfo = vi.mocked( logInfo );

	const createEntry = ( message: string ): Entry => ( {
		message,
		data: {
			mainContent: undefined,
			restContent: [],
			type: 'feature',
			scope: [],
			closes: [],
			see: [],
			validations: [],
			communityCredits: []
		},
		changesetPath: ''
	} );

	const createSectionsWithEntries = ( overrides: Partial<SectionsWithEntries> = {} ): SectionsWithEntries => ( {
		major: { entries: [], title: 'Major Breaking Changes' },
		minor: { entries: [], title: 'Minor Breaking Changes' },
		breaking: { entries: [], title: 'Breaking Changes' },
		feature: { entries: [], title: 'Features' },
		fix: { entries: [], title: 'Bug fixes' },
		other: { entries: [], title: 'Other changes' },
		warning: { entries: [], title: 'Warning' },
		invalid: { entries: [], title: 'Invalid changes' },
		...overrides
	} );

	beforeEach( () => {
		vi.mocked( semver.inc ).mockImplementation( ( version, releaseType ) => {
			if ( version === '1.0.0' && releaseType === 'patch' ) {
				return '1.0.1';
			}

			return null;
		} );

		options = {
			sections: createSectionsWithEntries(),
			currentVersion: '1.0.0',
			packageName: 'test-package',
			nextVersion: undefined
		};
	} );

	it( 'should log the process start', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		await determineNextVersion( options );

		expect( mockedLogInfo ).toHaveBeenCalledWith( `○ ${ chalk.cyan( 'Determining the new version...' ) }` );
	} );

	it( 'should return a patch bump version when there are no breaking changes or feature entries', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '1.0.1' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'patch',
			displayValidationWarning: false
		} );
	} );

	it( 'should return provided version if it is not undefined or internal', async () => {
		options.nextVersion = '50.0.0';

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '50.0.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).not.toHaveBeenCalled();
		expect( mockedLogInfo ).toHaveBeenCalledWith( `○ ${ chalk.cyan( 'Determined the next version to be 50.0.0.' ) }` );
	} );

	it( 'should return a minor bump version when "MINOR BREAKING CHANGE" entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.1.0' );

		options.sections = createSectionsWithEntries(
			{ minor: { entries: [ createEntry( 'Minor breaking change' ) ], title: 'Minor Breaking Changes' } }
		);

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '1.1.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'minor',
			displayValidationWarning: false
		} );
	} );

	it( 'should return a minor bump version when Feature entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.1.0' );

		options.sections = createSectionsWithEntries(
			{ feature: { entries: [ createEntry( 'New feature' ) ], title: 'Features' } }
		);

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '1.1.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'minor',
			displayValidationWarning: false
		} );
	} );

	it( 'should return a major bump version when "BREAKING CHANGE" entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		options.sections = createSectionsWithEntries(
			{ breaking: { entries: [ createEntry( 'Breaking change' ) ], title: 'Major Breaking Changes' } }
		);

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '2.0.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'major',
			displayValidationWarning: false
		} );
	} );

	it( 'should return a major bump version when "MAJOR BREAKING CHANGE" entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		options.sections = createSectionsWithEntries(
			{ major: { entries: [ createEntry( 'Major breaking change' ) ], title: 'Major Breaking Changes' } }
		);

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '2.0.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'major',
			displayValidationWarning: false
		} );
	} );

	it( 'should prioritize "MAJOR BREAKING CHANGE" version even if "MINOR BREAKING CHANGES" and feature entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		options.sections = createSectionsWithEntries( {
			minor: { entries: [ createEntry( 'Some minor change' ) ], title: 'Minor Breaking Changes' },
			major: { entries: [ createEntry( 'Breaking change' ) ], title: 'Major Breaking Changes' },
			feature: { entries: [ createEntry( 'Some feature' ) ], title: 'Features' }
		} );

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '2.0.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'major',
			displayValidationWarning: false
		} );
	} );

	it( 'should handle internal version when nextVersion is set to "internal"', async () => {
		options.nextVersion = 'internal';

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '1.0.1' );
		expect( result.isInternal ).toBe( true );
		expect( mockedProvideNewVersion ).not.toHaveBeenCalled();
		expect( mockedLogInfo ).toHaveBeenCalledWith( `○ ${ chalk.cyan( 'Determined the next version to be 1.0.1.' ) }` );
	} );

	it( 'should handle internal version when user provides "internal" as version', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( 'internal' );

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '1.0.1' );
		expect( result.isInternal ).toBe( true );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'patch',
			displayValidationWarning: false
		} );
	} );

	it( 'should throw an error when semver.inc returns null', async () => {
		// Use an invalid version to test the error case
		options.currentVersion = 'invalid-version';
		options.nextVersion = 'internal';

		await expect(
			determineNextVersion( options )
		).rejects.toThrow( 'Unable to determine new version based on the version in root package.json.' );
	} );

	it( 'should set displayValidationWarning to true when invalid entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		options.sections = createSectionsWithEntries(
			{ invalid: { entries: [ createEntry( 'Invalid change' ) ], title: 'Invalid changes' } }
		);

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '1.0.1' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'patch',
			displayValidationWarning: true
		} );
	} );

	it( 'should set displayValidationWarning to true when entries have validations', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		const entryWithValidation = createEntry( 'Some change' );
		entryWithValidation.data.validations = [ 'Some validation warning' ];

		options.sections = createSectionsWithEntries(
			{ fix: { entries: [ entryWithValidation ], title: 'Bug fixes' } }
		);

		const result = await determineNextVersion( options );

		expect( result.newVersion ).toBe( '1.0.1' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'patch',
			displayValidationWarning: true
		} );
	} );
} );
