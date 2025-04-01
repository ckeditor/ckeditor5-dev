/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getNewChangelog } from '../../src/utils/getnewchangelog.js';
import { NPM_URL, SECTIONS, VERSIONING_POLICY_URL } from '../../src/constants.js';
import type { PackageJson, ReleaseInfo, Section } from '../../src/types.js';
import { describe, it, expect } from 'vitest';

describe( 'getNewChangelog', () => {
	const createSection = ( title: string, entries: Array<{ message: string }> = [] ): Section => ( {
		title,
		entries: entries.map( entry => ( {
			message: entry.message,
			data: {
				mainContent: undefined,
				restContent: [],
				type: 'other',
				scope: [],
				closes: [],
				see: []
			},
			changesetPath: ''
		} ) )
	} );

	const createPackageJson = ( name: string, version: string = '1.0.0' ): PackageJson => ( {
		name,
		version
	} );

	const createReleaseInfo = ( title: string, version: string, packages: Array<string> ): ReleaseInfo => ( {
		title,
		version,
		packages
	} );

	it( 'should return the correct header for initial release', () => {
		const result = getNewChangelog( {
			oldVersion: '0.0.1',
			newVersion: '1.0.0',
			dateFormatted: '2023-04-15',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: false,
			packageJsons: []
		} );

		expect( result ).toContain( '## 1.0.0 (2023-04-15)' );
		expect( result ).not.toContain( 'https://github.com/ckeditor/ckeditor5/compare' );
	} );

	it( 'should return the correct header with comparison link for non-initial release', () => {
		const result = getNewChangelog( {
			oldVersion: '1.0.0',
			newVersion: '1.1.0',
			dateFormatted: '2023-04-15',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: false,
			packageJsons: []
		} );

		expect( result ).toContain( '## [1.1.0](https://github.com/ckeditor/ckeditor5/compare/v1.0.0...v1.1.0) (2023-04-15)' );
	} );

	it( 'should include the "Internal changes only" message for internal releases', () => {
		const result = getNewChangelog( {
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			dateFormatted: '2023-04-15',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: true,
			packageJsons: [
				createPackageJson( '@ckeditor/ckeditor5-package-a' ),
				createPackageJson( '@ckeditor/ckeditor5-package-b' )
			]
		} );

		expect( result ).toContain( 'Internal changes only (updated dependencies, documentation, etc.).' );
	} );

	it( 'should include section entries in the changelog', () => {
		const sectionsToDisplay = [
			createSection( 'Features', [
				{ message: '* Added new feature A.' },
				{ message: '* Added new feature B.' }
			] ),
			createSection( 'Bug fixes', [
				{ message: '* Fixed bug X.' }
			] )
		];

		const result = getNewChangelog( {
			oldVersion: '1.0.0',
			newVersion: '1.1.0',
			dateFormatted: '2023-04-15',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay,
			releasedPackagesInfo: [],
			isInternal: false,
			packageJsons: []
		} );

		expect( result ).toContain( '### Features' );
		expect( result ).toContain( '* Added new feature A.' );
		expect( result ).toContain( '* Added new feature B.' );
		expect( result ).toContain( '### Bug fixes' );
		expect( result ).toContain( '* Fixed bug X.' );
	} );

	it( 'should include released packages information for non-internal releases', () => {
		const releasedPackagesInfo = [
			createReleaseInfo( 'Major releases (contain major breaking changes)', 'v2.0.0', [
				'@ckeditor/ckeditor5-package-a'
			] ),
			createReleaseInfo( 'Minor releases (contain minor breaking changes)', 'v1.1.0', [
				'@ckeditor/ckeditor5-package-b',
				'@ckeditor/ckeditor5-package-c'
			] )
		];

		const result = getNewChangelog( {
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			dateFormatted: '2023-04-15',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [],
			releasedPackagesInfo,
			isInternal: false,
			packageJsons: []
		} );

		expect( result ).toContain( '### Released packages' );
		expect( result ).toContain( `Check out the [Versioning policy](${ VERSIONING_POLICY_URL }) guide for more information.` );
		expect( result ).toContain( 'Major releases (contain major breaking changes)' );
		expect( result ).toContain( `* [@ckeditor/ckeditor5-package-a](${ NPM_URL }/@ckeditor/ckeditor5-package-a/v/2.0.0): v2.0.0` );
		expect( result ).toContain( 'Minor releases (contain minor breaking changes)' );
		expect( result ).toContain( `* [@ckeditor/ckeditor5-package-b](${ NPM_URL }/@ckeditor/ckeditor5-package-b/v/2.0.0): v1.1.0` );
		expect( result ).toContain( `* [@ckeditor/ckeditor5-package-c](${ NPM_URL }/@ckeditor/ckeditor5-package-c/v/2.0.0): v1.1.0` );
	} );

	it( 'should include internal version bumps information for internal releases', () => {
		const packageJsons = [
			createPackageJson( '@ckeditor/ckeditor5-package-a' ),
			createPackageJson( '@ckeditor/ckeditor5-package-b' )
		];

		const result = getNewChangelog( {
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			dateFormatted: '2023-04-15',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: true,
			packageJsons
		} );

		expect( result ).toContain( SECTIONS.other.title + ':' );
		expect( result ).toContain(
			`* [@ckeditor/ckeditor5-package-a](${ NPM_URL }/@ckeditor/ckeditor5-package-a/v/1.0.1): v1.0.0 => v1.0.1`
		);
		expect( result ).toContain(
			`* [@ckeditor/ckeditor5-package-b](${ NPM_URL }/@ckeditor/ckeditor5-package-b/v/1.0.1): v1.0.0 => v1.0.1`
		);
	} );

	it( 'should sort package names alphabetically', () => {
		const packageJsons = [
			createPackageJson( '@ckeditor/ckeditor5-package-c' ),
			createPackageJson( '@ckeditor/ckeditor5-package-a' ),
			createPackageJson( '@ckeditor/ckeditor5-package-b' )
		];

		const result = getNewChangelog( {
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			dateFormatted: '2023-04-15',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: true,
			packageJsons
		} );

		const packageAIndex = result.indexOf( '@ckeditor/ckeditor5-package-a' );
		const packageBIndex = result.indexOf( '@ckeditor/ckeditor5-package-b' );
		const packageCIndex = result.indexOf( '@ckeditor/ckeditor5-package-c' );

		expect( packageAIndex ).toBeLessThan( packageBIndex );
		expect( packageBIndex ).toBeLessThan( packageCIndex );
	} );

	it( 'should include the complete changelog structure with details tag', () => {
		const result = getNewChangelog( {
			oldVersion: '1.0.0',
			newVersion: '1.1.0',
			dateFormatted: '2023-04-15',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: false,
			packageJsons: []
		} );

		const detailsIndex = result.indexOf( '<details>' );
		const summaryIndex = result.indexOf( '<summary>Released packages (summary)</summary>' );
		const closeDetailsIndex = result.indexOf( '</details>' );

		expect( detailsIndex ).toBeGreaterThan( -1 );
		expect( summaryIndex ).toBeGreaterThan( detailsIndex );
		expect( closeDetailsIndex ).toBeGreaterThan( summaryIndex );
	} );
} );
