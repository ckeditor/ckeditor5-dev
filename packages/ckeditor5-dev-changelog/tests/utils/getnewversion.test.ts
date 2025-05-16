/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getNewVersion, type GetNewVersionArgs } from '../../src/utils/getnewversion.js';
import { provideNewVersionForMonorepository } from '../../src/utils/external/providenewversionformonorepository.js';
import { logInfo } from '../../src/utils/loginfo.js';
import type { Entry, SectionsWithEntries } from '../../src/types.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import chalk from 'chalk';
import semver from 'semver';

vi.mock( '../../src/utils/external/providenewversionformonorepository' );
vi.mock( '../../src/utils/loginfo' );
vi.mock( 'semver', () => {
	return {
		default: {
			inc: vi.fn()
		}
	};
} );

describe( 'getNewVersion()', () => {
	let options: GetNewVersionArgs;
	const mockedProvideNewVersion = vi.mocked( provideNewVersionForMonorepository );
	const mockedLogInfo = vi.mocked( logInfo );

	const createEntry = ( message: string ): Entry => ( {
		message,
		data: {
			mainContent: undefined,
			restContent: [],
			'breaking-change': 'major',
			type: 'feature',
			scope: [],
			closes: [],
			see: []
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
			sectionsWithEntries: createSectionsWithEntries(),
			oldVersion: '1.0.0',
			packageName: 'test-package',
			nextVersion: undefined
		};
	} );

	it( 'should log the process start', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		await getNewVersion( options );

		expect( mockedLogInfo ).toHaveBeenCalledWith( `○ ${ chalk.cyan( 'Determining the new version...' ) }` );
	} );

	it( 'should return a patch version when there are no minor, major, or feature entries', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		const result = await getNewVersion( options );

		expect( result.newVersion ).toBe( '1.0.1' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'patch'
		} );
	} );

	it( 'should return provided version if it is not undefined or internal', async () => {
		options.nextVersion = '50.0.0';

		const result = await getNewVersion( options );

		expect( result.newVersion ).toBe( '50.0.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).not.toHaveBeenCalled();
	} );

	it( 'should return a minor version when minor entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.1.0' );

		options.sectionsWithEntries = createSectionsWithEntries(
			{ minor: { entries: [ createEntry( 'Some minor change' ) ], title: 'Minor Breaking Changes' } }
		);

		const result = await getNewVersion( options );

		expect( result.newVersion ).toBe( '1.1.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'minor'
		} );
	} );

	it( 'should return a minor version when Feature entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.1.0' );

		options.sectionsWithEntries = createSectionsWithEntries(
			{ feature: { entries: [ createEntry( 'New feature' ) ], title: 'Features' } }
		);

		const result = await getNewVersion( options );

		expect( result.newVersion ).toBe( '1.1.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'minor'
		} );
	} );

	it( 'should return a major version when major entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		options.sectionsWithEntries = createSectionsWithEntries(
			{ major: { entries: [ createEntry( 'Breaking change' ) ], title: 'Major Breaking Changes' } }
		);

		const result = await getNewVersion( options );

		expect( result.newVersion ).toBe( '2.0.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'major'
		} );
	} );

	it( 'should prioritize major version even if minor and feature entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		options.sectionsWithEntries = createSectionsWithEntries( {
			minor: { entries: [ createEntry( 'Some minor change' ) ], title: 'Minor Breaking Changes' },
			major: { entries: [ createEntry( 'Breaking change' ) ], title: 'Major Breaking Changes' },
			feature: { entries: [ createEntry( 'Some feature' ) ], title: 'Features' }
		} );

		const result = await getNewVersion( options );

		expect( result.newVersion ).toBe( '2.0.0' );
		expect( result.isInternal ).toBe( false );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'major'
		} );
	} );

	it( 'should handle internal version when nextVersion is set to "internal"', async () => {
		options.nextVersion = 'internal';

		const result = await getNewVersion( options );

		expect( result.newVersion ).toBe( '1.0.1' );
		expect( result.isInternal ).toBe( true );
		expect( mockedProvideNewVersion ).not.toHaveBeenCalled();
	} );

	it( 'should handle internal version when user provides "internal" as version', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( 'internal' );

		const result = await getNewVersion( options );

		expect( result.newVersion ).toBe( '1.0.1' );
		expect( result.isInternal ).toBe( true );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'patch'
		} );
	} );

	it( 'should throw an error when semver.inc returns null', async () => {
		// Use an invalid version to test the error case
		options.oldVersion = 'invalid-version';
		options.nextVersion = 'internal';

		await expect(
			getNewVersion( options )
		).rejects.toThrow( 'Unable to determine new version based on the version in root package.json.' );
	} );
} );
