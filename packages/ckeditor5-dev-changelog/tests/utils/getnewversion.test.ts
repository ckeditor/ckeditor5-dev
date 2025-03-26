/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getNewVersion } from '../../src/utils/getnewversion.js';
import { provideNewVersionForMonoRepository } from '../../src/utils/providenewversionformonorepository.js';
import { logInfo } from '../../src/utils/loginfo.js';
import type { Entry, SectionsWithEntries } from '../../src/types.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import chalk from 'chalk';

vi.mock( '../../src/utils/providenewversionformonorepository' );
vi.mock( '../../src/utils/loginfo' );

describe( 'getNewVersion', () => {
	const mockedProvideNewVersion = vi.mocked( provideNewVersionForMonoRepository );
	const mockedLogInfo = vi.mocked( logInfo );

	const createEntry = ( message: string ): Entry => ( {
		message,
		data: {
			mainContent: undefined,
			restContent: [],
			'breaking-change': 'major',
			type: 'Feature',
			scope: [],
			closes: [],
			see: []
		}
	} );

	const createSectionsWithEntries = ( overrides: Partial<SectionsWithEntries> = {} ): SectionsWithEntries => ( {
		major: { entries: [], title: 'Major Breaking Changes' },
		minor: { entries: [], title: 'Minor Breaking Changes' },
		Feature: { entries: [], title: 'Features' },
		Fix: { entries: [], title: 'Bug fixes' },
		Other: { entries: [], title: 'Other changes' },
		invalid: { entries: [], title: 'Invalid changes' },
		...overrides
	} );

	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'should log the process start', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		await getNewVersion( createSectionsWithEntries(), '1.0.0', 'test-package' );

		expect( mockedLogInfo ).toHaveBeenCalledWith( `📍 ${ chalk.cyan( 'Determining the new version...' ) }\n` );
	} );

	it( 'should return a patch version when there are no minor, major, or feature entries', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		const result = await getNewVersion( createSectionsWithEntries(), '1.0.0', 'test-package' );

		expect( result ).toBe( '1.0.1' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'patch'
		} );
	} );

	it( 'should return a minor version when minor entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.1.0' );

		const sectionsWithEntries = createSectionsWithEntries(
			{ minor: { entries: [ createEntry( 'Some minor change' ) ], title: 'Minor Breaking Changes' } }
		);

		const result = await getNewVersion( sectionsWithEntries, '1.0.0', 'test-package' );

		expect( result ).toBe( '1.1.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'minor'
		} );
	} );

	it( 'should return a minor version when Feature entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.1.0' );

		const sectionsWithEntries = createSectionsWithEntries(
			{ Feature: { entries: [ createEntry( 'New feature' ) ], title: 'Features' } }
		);

		const result = await getNewVersion( sectionsWithEntries, '1.0.0', 'test-package' );

		expect( result ).toBe( '1.1.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'minor'
		} );
	} );

	it( 'should return a major version when major entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		const sectionsWithEntries = createSectionsWithEntries(
			{ major: { entries: [ createEntry( 'Breaking change' ) ], title: 'Major Breaking Changes' } }
		);

		const result = await getNewVersion( sectionsWithEntries, '1.0.0', 'test-package' );

		expect( result ).toBe( '2.0.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'major'
		} );
	} );

	it( 'should prioritize major version even if minor and feature entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		const sectionsWithEntries = createSectionsWithEntries( {
			minor: { entries: [ createEntry( 'Some minor change' ) ], title: 'Minor Breaking Changes' },
			major: { entries: [ createEntry( 'Breaking change' ) ], title: 'Major Breaking Changes' },
			Feature: { entries: [ createEntry( 'Some feature' ) ], title: 'Features' }
		} );

		const result = await getNewVersion( sectionsWithEntries, '1.0.0', 'test-package' );

		expect( result ).toBe( '2.0.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'major'
		} );
	} );
} );
