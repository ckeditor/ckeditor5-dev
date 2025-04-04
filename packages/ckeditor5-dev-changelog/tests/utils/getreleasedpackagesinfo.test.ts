/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { getReleasedPackagesInfo } from '../../src/utils/getreleasedpackagesinfo.js';
import type { SectionsWithEntries, PackageJson, Entry } from '../../src/types.js';

const createEntry = ( scope: Array<string> ): Entry => ( {
	message: '',
	data: {
		scope,
		type: '',
		closes: [],
		see: [],
		mainContent: '',
		restContent: []
	},
	changesetPath: '/path/to/changeset1.md'
} );

const createSectionsWithEntries = ( overrides: Partial<SectionsWithEntries> = {} ): SectionsWithEntries => ( {
	major: { entries: [], title: 'Major Breaking Changes' },
	minor: { entries: [], title: 'Minor Breaking Changes' },
	feature: { entries: [], title: 'Features' },
	fix: { entries: [], title: 'Bug fixes' },
	other: { entries: [], title: 'Other changes' },
	invalid: { entries: [], title: 'Invalid changes' },
	...overrides
} );

const organisationNamespace = '@ckeditor';

describe( 'getReleasedPackagesInfo()', () => {
	it( 'should categorize new, major, minor, feature, and other releases correctly', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'core' ] ) ], title: 'Major Breaking Changes' },
			minor: { entries: [ createEntry( [ 'ui' ] ) ], title: 'Minor Breaking Changes' },
			feature: { entries: [ createEntry( [ 'editor' ] ) ], title: 'Features' }
		} );

		const packageJsons: Array<PackageJson> = [
			{ name: '@ckeditor/core', version: '1.0.0' },
			{ name: '@ckeditor/ui', version: '1.0.0' },
			{ name: '@ckeditor/editor', version: '1.0.0' },
			{ name: '@ckeditor/new-package', version: '0.0.1' }
		];

		const result = await getReleasedPackagesInfo( {
			sections,
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			packageJsons,
			organisationNamespace
		} );

		expect( result ).toEqual( [
			{ title: 'New packages:', version: 'v2.0.0', packages: [ '@ckeditor/new-package' ] },
			{ title: 'Major releases (contain major breaking changes):', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/core' ] },
			{ title: 'Minor releases (contain minor breaking changes):', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/ui' ] },
			{ title: 'Releases containing new features:', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/editor' ] }
		] );
	} );

	it( 'should filter out new version releases from major releases', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'core', 'new-package' ] ) ], title: 'Major Breaking Changes' }
		} );

		const packageJsons: Array<PackageJson> = [
			{ name: '@ckeditor/core', version: '1.0.0' },
			{ name: '@ckeditor/new-package', version: '0.0.1' }
		];

		const result = await getReleasedPackagesInfo( {
			sections,
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			packageJsons,
			organisationNamespace
		} );

		expect( result ).toEqual( [
			{ title: 'New packages:', version: 'v2.0.0', packages: [ '@ckeditor/new-package' ] },
			{ title: 'Major releases (contain major breaking changes):', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/core' ] }
		] );
	} );

	it( 'should filter out new version releases and major releases from minor releases', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'core' ] ) ], title: 'Major' },
			minor: { entries: [ createEntry( [ 'ui', 'new-package', 'core' ] ) ], title: 'Minor' }
		} );

		const packageJsons: Array<PackageJson> = [
			{ name: '@ckeditor/core', version: '1.0.0' },
			{ name: '@ckeditor/ui', version: '1.0.0' },
			{ name: '@ckeditor/new-package', version: '0.0.1' }
		];

		const result = await getReleasedPackagesInfo( {
			sections,
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			packageJsons,
			organisationNamespace
		} );

		expect( result ).toEqual( [
			{ title: 'New packages:', version: 'v2.0.0', packages: [ '@ckeditor/new-package' ] },
			{ title: 'Major releases (contain major breaking changes):', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/core' ] },
			{ title: 'Minor releases (contain minor breaking changes):', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/ui' ] }
		] );
	} );

	it( 'should filter out new version, minor, major nad new feature releases from other releases', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'core' ] ) ], title: '' },
			minor: { entries: [ createEntry( [ 'ui', 'new-package', 'core' ] ) ], title: '' },
			feature: { entries: [ createEntry( [ 'editor', 'new-package' ] ) ], title: '' },
			other: { entries: [ createEntry( [ 'other', 'ui', 'editor', 'core', 'new-package' ] ) ], title: '' }
		} );

		const packageJsons: Array<PackageJson> = [
			{ name: '@ckeditor/core', version: '1.0.0' },
			{ name: '@ckeditor/ui', version: '1.0.0' },
			{ name: '@ckeditor/editor', version: '1.0.0' },
			{ name: '@ckeditor/other', version: '1.0.0' },
			{ name: '@ckeditor/new-package', version: '0.0.1' }
		];

		const result = await getReleasedPackagesInfo( {
			sections,
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			packageJsons,
			organisationNamespace
		} );

		expect( result ).toEqual( [
			{ title: 'New packages:', version: 'v2.0.0', packages: [ '@ckeditor/new-package' ] },
			{ title: 'Major releases (contain major breaking changes):', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/core' ] },
			{ title: 'Minor releases (contain minor breaking changes):', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/ui' ] },
			{ title: 'Releases containing new features:', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/editor' ] },
			{ title: 'Other releases:', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/other' ] }
		] );
	} );

	it( 'should return an empty array when there are no releases', async () => {
		const sections = createSectionsWithEntries();
		const packageJsons: Array<PackageJson> = [];

		const result = await getReleasedPackagesInfo( {
			sections,
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			packageJsons,
			organisationNamespace
		} );

		expect( result ).toEqual( [] );
	} );

	it( 'should handle only new package releases', async () => {
		const sections = createSectionsWithEntries();
		const packageJsons: Array<PackageJson> = [
			{ name: '@ckeditor/new-package-1', version: '0.0.1' },
			{ name: '@ckeditor/new-package-2', version: '0.0.1' }
		];

		const result = await getReleasedPackagesInfo( {
			sections,
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			packageJsons,
			organisationNamespace
		} );

		expect( result ).toEqual( [
			{ title: 'New packages:', version: 'v2.0.0', packages: [ '@ckeditor/new-package-1', '@ckeditor/new-package-2' ] }
		] );
	} );

	it( 'should return only other releases when no categorized changes exist', async () => {
		const packageJsons: Array<PackageJson> = [ { name: '@ckeditor/uncategorized', version: '1.0.0' } ];
		const sections = createSectionsWithEntries();

		const result = await getReleasedPackagesInfo( {
			sections,
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			packageJsons,
			organisationNamespace
		} );

		expect( result ).toEqual( [
			{ title: 'Other releases:', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/uncategorized' ] }
		] );
	} );

	it( 'should remove duplicate package names in scope', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'core' ] ) ], title: 'Major Breaking Changes' },
			minor: { entries: [ createEntry( [ 'core' ] ) ], title: 'Minor Breaking Changes' }
		} );
		const packageJsons: Array<PackageJson> = [ { name: '@ckeditor/core', version: '1.0.0' } ];

		const result = await getReleasedPackagesInfo( {
			sections,
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			packageJsons,
			organisationNamespace
		} );

		expect( result ).toEqual( [
			{ title: 'Major releases (contain major breaking changes):', version: 'v1.0.0 => v2.0.0', packages: [ '@ckeditor/core' ] }
		] );
	} );
} );
