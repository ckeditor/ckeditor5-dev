/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { getNewChangelog } from '../../src/utils/getnewchangelog.js';
import { NPM_URL, SECTIONS, VERSIONING_POLICY_URL } from '../../src/utils/constants.js';
import type { ReleaseInfo, Section } from '../../src/types.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'getNewChangelog()', () => {
	beforeEach( () => {
		vi.mocked( workspaces.getRepositoryUrl ).mockResolvedValue( 'https://github.com/ckeditor/ckeditor5' );
	} );

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

	const createReleaseInfo = ( title: string, version: string, packages: Array<string> ): ReleaseInfo => ( {
		title,
		version,
		packages
	} );

	it( 'should return the correct header for initial release', async () => {
		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '0.0.1',
			newVersion: '1.0.0',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: false,
			isSinglePackage: false,
			packagesMetadata: new Map()
		} );

		expect( result ).toContain( '## 1.0.0 (April 15, 2023)' );
		expect( result ).not.toContain( '/compare' );
	} );

	it( 'should return the correct header with comparison link for non-initial release', async () => {
		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '1.0.0',
			newVersion: '1.1.0',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: false,
			isSinglePackage: false,
			packagesMetadata: new Map()
		} );

		expect( result ).toContain( '## [1.1.0]' );
		expect( result ).toContain( '/compare/v1.0.0...v1.1.0' );
		expect( result ).toContain( '(April 15, 2023)' );
	} );

	it( 'should include the "Internal changes only" message for internal releases', async () => {
		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-package-a', '1.0.0' ],
			[ '@ckeditor/ckeditor5-package-b', '1.0.0' ]
		] );

		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: true,
			isSinglePackage: false,
			packagesMetadata
		} );

		expect( result ).toContain( 'Internal changes only (updated dependencies, documentation, etc.).' );
	} );

	it( 'should include section entries in the changelog', async () => {
		const sectionsToDisplay = [
			createSection( 'Features', [
				{ message: '* Added new feature A.' },
				{ message: '* Added new feature B.' }
			] ),
			createSection( 'Bug fixes', [
				{ message: '* Fixed bug X.' }
			] )
		];

		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '1.0.0',
			newVersion: '1.1.0',
			sectionsToDisplay,
			releasedPackagesInfo: [],
			isInternal: false,
			isSinglePackage: false,
			packagesMetadata: new Map()
		} );

		expect( result ).toContain( '### Features' );
		expect( result ).toContain( '* Added new feature A.' );
		expect( result ).toContain( '* Added new feature B.' );
		expect( result ).toContain( '### Bug fixes' );
		expect( result ).toContain( '* Fixed bug X.' );
	} );

	it( 'should include released packages information for non-internal releases', async () => {
		const releasedPackagesInfo = [
			createReleaseInfo( 'Major releases (contain major breaking changes)', 'v2.0.0', [
				'@ckeditor/ckeditor5-package-a'
			] ),
			createReleaseInfo( 'Minor releases (contain minor breaking changes)', 'v1.1.0', [
				'@ckeditor/ckeditor5-package-b',
				'@ckeditor/ckeditor5-package-c'
			] )
		];

		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			sectionsToDisplay: [],
			releasedPackagesInfo,
			isInternal: false,
			isSinglePackage: false,
			packagesMetadata: new Map()
		} );

		expect( result ).toContain( '### Released packages' );
		expect( result ).toContain( `Check out the [Versioning policy](${ VERSIONING_POLICY_URL }) guide for more information.` );
		expect( result ).toContain( 'Major releases (contain major breaking changes)' );
		expect( result ).toContain( `* [@ckeditor/ckeditor5-package-a](${ NPM_URL }/@ckeditor/ckeditor5-package-a/v/2.0.0): v2.0.0` );
		expect( result ).toContain( 'Minor releases (contain minor breaking changes)' );
		expect( result ).toContain( `* [@ckeditor/ckeditor5-package-b](${ NPM_URL }/@ckeditor/ckeditor5-package-b/v/2.0.0): v1.1.0` );
		expect( result ).toContain( `* [@ckeditor/ckeditor5-package-c](${ NPM_URL }/@ckeditor/ckeditor5-package-c/v/2.0.0): v1.1.0` );
	} );

	it( 'should not include the `Released packages` section for single package changelogs', async () => {
		const releasedPackagesInfo = [
			createReleaseInfo( 'Major releases (contain major breaking changes)', 'v2.0.0', [
				'@ckeditor/ckeditor5-package-a'
			] ),
			createReleaseInfo( 'Minor releases (contain minor breaking changes)', 'v1.1.0', [
				'@ckeditor/ckeditor5-package-b',
				'@ckeditor/ckeditor5-package-c'
			] )
		];

		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '1.0.0',
			newVersion: '2.0.0',
			sectionsToDisplay: [],
			releasedPackagesInfo,
			isInternal: false,
			isSinglePackage: true,
			packagesMetadata: new Map()
		} );

		expect( result ).not.toContain( '### Released packages' );
	} );

	it( 'should include internal version bumps information for internal releases', async () => {
		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-package-a', '1.0.0' ],
			[ '@ckeditor/ckeditor5-package-b', '1.0.0' ]
		] );

		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: true,
			isSinglePackage: false,
			packagesMetadata
		} );

		expect( result ).toContain( SECTIONS.other.title + ':' );
		expect( result ).toContain(
			`* [@ckeditor/ckeditor5-package-a](${ NPM_URL }/@ckeditor/ckeditor5-package-a/v/1.0.1): v1.0.0 => v1.0.1`
		);
		expect( result ).toContain(
			`* [@ckeditor/ckeditor5-package-b](${ NPM_URL }/@ckeditor/ckeditor5-package-b/v/1.0.1): v1.0.0 => v1.0.1`
		);
	} );

	it( 'should preserve package order from Map keys', async () => {
		const packagesMetadata = new Map( [
			[ '@ckeditor/ckeditor5-package-c', '1.0.0' ],
			[ '@ckeditor/ckeditor5-package-a', '1.0.0' ],
			[ '@ckeditor/ckeditor5-package-b', '1.0.0' ]
		] );

		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: true,
			isSinglePackage: false,
			packagesMetadata
		} );

		const packageAIndex = result.indexOf( '@ckeditor/ckeditor5-package-a' );
		const packageBIndex = result.indexOf( '@ckeditor/ckeditor5-package-b' );
		const packageCIndex = result.indexOf( '@ckeditor/ckeditor5-package-c' );

		// Since Map preserves insertion order, C should come first, then A, then B
		expect( packageCIndex ).toBeLessThan( packageAIndex );
		expect( packageAIndex ).toBeLessThan( packageBIndex );
	} );

	it( 'should include the complete changelog structure with details tag', async () => {
		const result = await getNewChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			oldVersion: '1.0.0',
			newVersion: '1.1.0',
			sectionsToDisplay: [],
			releasedPackagesInfo: [],
			isInternal: false,
			isSinglePackage: false,
			packagesMetadata: new Map()
		} );

		const detailsIndex = result.indexOf( '<details>' );
		const summaryIndex = result.indexOf( '<summary>Released packages (summary)</summary>' );
		const closeDetailsIndex = result.indexOf( '</details>' );

		expect( detailsIndex ).toBeGreaterThan( -1 );
		expect( summaryIndex ).toBeGreaterThan( detailsIndex );
		expect( closeDetailsIndex ).toBeGreaterThan( summaryIndex );
	} );
} );
