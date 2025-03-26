/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { getReleasedPackagesInfo } from '../../src/utils/getreleasedpackagesinfo.js';
import type { SectionsWithEntries, PackageJson, SectionName, Entry } from '../../src/types.js';

const createEntry = ( scope: Array<string>, type: SectionName, breakingChange: SectionName, message: string = '' ): Entry => ( {
	message,
	data: {
		scope,
		type,
		'breaking-change': breakingChange,
		closes: [],
		see: [],
		mainContent: '',
		restContent: []
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

describe( 'getReleasedPackagesInfo', () => {
	it( 'should categorize new, major, minor, feature, and other releases correctly', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'core' ], 'major', 'major', 'Major change' ) ], title: 'Major Breaking Changes' },
			minor: { entries: [ createEntry( [ 'ui' ], 'minor', 'minor', 'Minor change' ) ], title: 'Minor Breaking Changes' },
			Feature: { entries: [ createEntry( [ 'editor' ], 'Feature', 'minor', 'Feature change' ) ], title: 'Features' }
		} );

		const packages: Array<PackageJson> = [
			{ name: '@ckeditor/core', version: '1.0.0' },
			{ name: '@ckeditor/ui', version: '1.0.0' },
			{ name: '@ckeditor/editor', version: '1.0.0' },
			{ name: '@ckeditor/new-package', version: '0.0.1' }
		];

		const result = await getReleasedPackagesInfo( { sections, oldVersion: '1.0.0', newVersion: '2.0.0', packages } );

		expect( result ).toEqual( [
			{ title: 'New packages:', version: '2.0.0', packages: [ '@ckeditor/new-package' ] },
			{ title: 'Major releases (contain major breaking changes):', version: '1.0.0 => 2.0.0', packages: [ '@ckeditor/core' ] },
			{ title: 'Minor releases (contain minor breaking changes):', version: '1.0.0 => 2.0.0', packages: [ '@ckeditor/ui' ] },
			{ title: 'Releases containing new features:', version: '1.0.0 => 2.0.0', packages: [ '@ckeditor/editor' ] }
		] );
	} );

	it( 'should return an empty array when there are no releases', async () => {
		const sections = createSectionsWithEntries();
		const packages: Array<PackageJson> = [];

		const result = await getReleasedPackagesInfo( { sections, oldVersion: '1.0.0', newVersion: '2.0.0', packages } );

		expect( result ).toEqual( [] );
	} );

	it( 'should handle only new package releases', async () => {
		const sections = createSectionsWithEntries();
		const packages: Array<PackageJson> = [
			{ name: '@ckeditor/new-package-1', version: '0.0.1' },
			{ name: '@ckeditor/new-package-2', version: '0.0.1' }
		];

		const result = await getReleasedPackagesInfo( { sections, oldVersion: '1.0.0', newVersion: '2.0.0', packages } );

		expect( result ).toEqual( [
			{ title: 'New packages:', version: '2.0.0', packages: [ '@ckeditor/new-package-1', '@ckeditor/new-package-2' ] }
		] );
	} );

	it( 'should return only other releases when no categorized changes exist', async () => {
		const packages: Array<PackageJson> = [ { name: '@ckeditor/uncategorized', version: '1.0.0' } ];
		const sections = createSectionsWithEntries();

		const result = await getReleasedPackagesInfo( { sections, oldVersion: '1.0.0', newVersion: '2.0.0', packages } );

		expect( result ).toEqual( [
			{ title: 'Other releases:', version: '1.0.0 => 2.0.0', packages: [ '@ckeditor/uncategorized' ] }
		] );
	} );

	it( 'should remove duplicate package names in scope', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'core' ], 'major', 'major', 'Duplicate scope' ) ], title: 'Major Breaking Changes' },
			minor: { entries: [ createEntry( [ 'core' ], 'minor', 'minor', 'Duplicate scope' ) ], title: 'Minor Breaking Changes' }
		} );
		const packages: Array<PackageJson> = [ { name: '@ckeditor/core', version: '1.0.0' } ];

		const result = await getReleasedPackagesInfo( { sections, oldVersion: '1.0.0', newVersion: '2.0.0', packages } );

		expect( result ).toEqual( [
			{ title: 'Major releases (contain major breaking changes):', version: '1.0.0 => 2.0.0', packages: [ '@ckeditor/core' ] }
		] );
	} );
} );
