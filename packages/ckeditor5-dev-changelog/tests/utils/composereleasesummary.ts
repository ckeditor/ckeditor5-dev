/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { composeReleaseSummary } from '../../src/utils/composereleasesummary.js';
import type { SectionsWithEntries, Entry } from '../../src/types.js';

const createEntry = ( scope: Array<string> ): Entry => ( {
	message: '',
	data: {
		scope,
		type: '',
		closes: [],
		see: [],
		mainContent: '',
		restContent: [],
		communityCredits: [],
		validations: []
	},
	changesetPath: '/path/to/changeset1.md'
} );

const createSectionsWithEntries = (
	overrides: Partial<SectionsWithEntries> = {}
): SectionsWithEntries => ( {
	major: { entries: [], title: 'Major Breaking Changes' },
	minor: { entries: [], title: 'Minor Breaking Changes' },
	breaking: { entries: [], title: 'Breaking Changes' },
	feature: { entries: [], title: 'Features' },
	fix: { entries: [], title: 'Bug fixes' },
	other: { entries: [], title: 'Other changes' },
	warning: { entries: [], title: 'Warning Changes' },
	invalid: { entries: [], title: 'Invalid changes' },
	...overrides
} );

describe( 'getReleasedPackagesInfo()', () => {
	it( 'should categorize new, major, minor, feature, and other releases correctly', async () => {
		const sections = createSectionsWithEntries( {
			major: {
				entries: [ createEntry( [ 'ckeditor5-core' ] ) ],
				title: 'Major Breaking Changes'
			},
			minor: {
				entries: [ createEntry( [ 'ckeditor5-ui' ] ) ],
				title: 'Minor Breaking Changes'
			},
			feature: {
				entries: [ createEntry( [ 'ckeditor5-editor-classic' ] ) ],
				title: 'Features'
			}
		} );

		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-core', '1.0.0' ],
			[ '@ckeditor/ckeditor5-ui', '1.0.0' ],
			[ '@ckeditor/ckeditor5-editor-classic', '1.0.0' ],
			[ '@ckeditor/ckeditor5-new-package', '0.0.1' ]
		] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'New packages:',
				version: 'v2.0.0',
				packages: [ '@ckeditor/ckeditor5-new-package' ]
			},
			{
				title: 'Major releases (contain major breaking changes):',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-core' ]
			},
			{
				title: 'Minor releases (contain minor breaking changes):',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-ui' ]
			},
			{
				title: 'Releases containing new features:',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-editor-classic' ]
			}
		] );
	} );

	it( 'should categorize a non-scoped package', async () => {
		const sections = createSectionsWithEntries( {
			feature: {
				entries: [ createEntry( [ 'ckeditor5' ] ) ],
				title: 'Features'
			}
		} );

		const packagesMetadata = new Map( [
			[ 'ckeditor5', '1.0.0' ]
		] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '1.1.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'Releases containing new features:',
				version: 'v1.0.0 => v1.1.0',
				packages: [ 'ckeditor5' ]
			}
		] );
	} );

	it( 'should filter out new version releases from major releases', async () => {
		const sections = createSectionsWithEntries( {
			major: {
				entries: [ createEntry( [ 'ckeditor5-core', 'ckeditor5-new-package' ] ) ],
				title: 'Major Breaking Changes'
			}
		} );

		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-core', '1.0.0' ],
			[ '@ckeditor/ckeditor5-new-package', '0.0.1' ]
		] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'New packages:',
				version: 'v2.0.0',
				packages: [ '@ckeditor/ckeditor5-new-package' ]
			},
			{
				title: 'Major releases (contain major breaking changes):',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-core' ]
			}
		] );
	} );

	it( 'should filter out new version releases and major releases from minor releases', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'ckeditor5-core' ] ) ], title: 'Major' },
			minor: {
				entries: [
					createEntry( [
						'ckeditor5-ui',
						'ckeditor5-new-package',
						'ckeditor5-core'
					] )
				],
				title: 'Minor'
			}
		} );

		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-core', '1.0.0' ],
			[ '@ckeditor/ckeditor5-ui', '1.0.0' ],
			[ '@ckeditor/ckeditor5-new-package', '0.0.1' ]
		] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'New packages:',
				version: 'v2.0.0',
				packages: [ '@ckeditor/ckeditor5-new-package' ]
			},
			{
				title: 'Major releases (contain major breaking changes):',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-core' ]
			},
			{
				title: 'Minor releases (contain minor breaking changes):',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-ui' ]
			}
		] );
	} );

	it( 'should filter out new version, minor, major nad new feature releases from other releases', async () => {
		const sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( [ 'ckeditor5-core' ] ) ], title: '' },
			minor: {
				entries: [
					createEntry( [
						'ckeditor5-ui',
						'ckeditor5-new-package',
						'ckeditor5-core'
					] )
				],
				title: ''
			},
			feature: {
				entries: [
					createEntry( [ 'ckeditor5-editor-classic', 'ckeditor5-new-package' ] )
				],
				title: ''
			},
			other: {
				entries: [
					createEntry( [
						'ckeditor5-other',
						'ckeditor5-ui',
						'ckeditor5-editor-classic',
						'ckeditor5-core',
						'ckeditor5-new-package'
					] )
				],
				title: ''
			}
		} );

		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-core', '1.0.0' ],
			[ '@ckeditor/ckeditor5-ui', '1.0.0' ],
			[ '@ckeditor/ckeditor5-editor-classic', '1.0.0' ],
			[ '@ckeditor/ckeditor5-other', '1.0.0' ],
			[ '@ckeditor/ckeditor5-new-package', '0.0.1' ]
		] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'New packages:',
				version: 'v2.0.0',
				packages: [ '@ckeditor/ckeditor5-new-package' ]
			},
			{
				title: 'Major releases (contain major breaking changes):',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-core' ]
			},
			{
				title: 'Minor releases (contain minor breaking changes):',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-ui' ]
			},
			{
				title: 'Releases containing new features:',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-editor-classic' ]
			},
			{
				title: 'Other releases:',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-other' ]
			}
		] );
	} );

	it( 'should return an empty array when there are no releases', async () => {
		const sections = createSectionsWithEntries();
		const packagesMetadata = new Map();

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [] );
	} );

	it( 'should handle only new package releases', async () => {
		const sections = createSectionsWithEntries();
		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-new-package-1', '0.0.1' ],
			[ '@ckeditor/ckeditor5-new-package-2', '0.0.1' ]
		] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'New packages:',
				version: 'v2.0.0',
				packages: [
					'@ckeditor/ckeditor5-new-package-1',
					'@ckeditor/ckeditor5-new-package-2'
				]
			}
		] );
	} );

	it( 'should return only other releases when no categorized changes exist', async () => {
		const packagesMetadata = new Map( [ [ '@ckeditor/uncategorized', '1.0.0' ] ] );
		const sections = createSectionsWithEntries();

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'Other releases:',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/uncategorized' ]
			}
		] );
	} );

	it( 'should remove duplicate package names in scope', async () => {
		const sections = createSectionsWithEntries( {
			major: {
				entries: [ createEntry( [ 'ckeditor5-core' ] ) ],
				title: 'Major Breaking Changes'
			},
			minor: {
				entries: [ createEntry( [ 'ckeditor5-core' ] ) ],
				title: 'Minor Breaking Changes'
			}
		} );
		const packagesMetadata = new Map( [ [ '@ckeditor/ckeditor5-core', '1.0.0' ] ] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'Major releases (contain major breaking changes):',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/ckeditor5-core' ]
			}
		] );
	} );

	it( 'should handle entries with undefined scope', async () => {
		const entryWithoutScope = createEntry( undefined as any );

		const sections = createSectionsWithEntries( {
			major: { entries: [ entryWithoutScope ], title: 'Major Breaking Changes' }
		} );
		const packagesMetadata = new Map( [ [ '@ckeditor/test', '1.0.0' ] ] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '2.0.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'Other releases:',
				version: 'v1.0.0 => v2.0.0',
				packages: [ '@ckeditor/test' ]
			}
		] );
	} );

	it( 'should not include the same package twice in the generated summary (the same section)', async () => {
		const sections = createSectionsWithEntries( {
			feature: {
				entries: [
					createEntry( [ 'ckeditor5-utils' ] ),
					createEntry( [ 'ckeditor5-utils' ] )
				],
				title: 'Features'
			}
		} );
		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-utils', '1.0.0' ]
		] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '1.1.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'Releases containing new features:',
				version: 'v1.0.0 => v1.1.0',
				packages: [
					'@ckeditor/ckeditor5-utils'
				]
			}
		] );
	} );

	it( 'should not include the same package twice in the generated summary (different sections)', async () => {
		const sections = createSectionsWithEntries( {
			feature: {
				entries: [
					createEntry( [ 'ckeditor5-utils' ] )
				],
				title: 'Features'
			},
			other: {
				entries: [
					createEntry( [ 'ckeditor5-utils' ] )
				],
				title: 'Other changes'
			}
		} );
		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-utils', '1.0.0' ]
		] );

		const result = await composeReleaseSummary( {
			sections,
			currentVersion: '1.0.0',
			newVersion: '1.1.0',
			packagesMetadata
		} );

		expect( result ).toEqual( [
			{
				title: 'Releases containing new features:',
				version: 'v1.0.0 => v1.1.0',
				packages: [
					'@ckeditor/ckeditor5-utils'
				]
			}
		] );
	} );
} );
