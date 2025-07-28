/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { composeChangelog, type ComposeChangelogOptions } from '../../src/utils/composechangelog.js';
import { NPM_URL, VERSIONING_POLICY_URL } from '../../src/utils/constants.js';
import type { ReleaseInfo, Section } from '../../src/types.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'composeChangelog()', () => {
	const options: ComposeChangelogOptions = {
		cwd: '/test/repo',
		date: '2023-04-15',
		currentVersion: '0.0.1',
		newVersion: '1.0.0',
		sections: [],
		releasedPackagesInfo: [],
		isSinglePackage: false
	};

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
				see: [],
				validations: [],
				communityCredits: []
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
		const result = await composeChangelog( options );

		expect( result ).toContain( '## 1.0.0 (April 15, 2023)' );
		expect( result ).not.toContain( '/compare' );
	} );

	it( 'should return the correct header with comparison link for non-initial release', async () => {
		const result = await composeChangelog( {
			cwd: '/test/repo',
			date: '2023-04-15',
			currentVersion: '1.0.0',
			newVersion: '1.1.0',
			sections: [],
			releasedPackagesInfo: [],
			isSinglePackage: false
		} );

		expect( result ).toContain( '## [1.1.0]' );
		expect( result ).toContain( '/compare/v1.0.0...v1.1.0' );
		expect( result ).toContain( '(April 15, 2023)' );
	} );

	it( 'should include section entries in the changelog', async () => {
		const sections = [
			createSection( 'Features', [
				{ message: '* Added new feature A.' },
				{ message: '* Added new feature B.' }
			] ),
			createSection( 'Bug fixes', [
				{ message: '* Fixed bug X.' }
			] )
		];

		const result = await composeChangelog( { ...options, sections } );

		expect( result ).toContain( '### Features' );
		expect( result ).toContain( '* Added new feature A.' );
		expect( result ).toContain( '* Added new feature B.' );
		expect( result ).toContain( '### Bug fixes' );
		expect( result ).toContain( '* Fixed bug X.' );
	} );

	it( 'should include released packages information', async () => {
		const releasedPackagesInfo = [
			createReleaseInfo( 'Major releases (contain major breaking changes)', 'v2.0.0', [
				'@ckeditor/ckeditor5-package-a'
			] ),
			createReleaseInfo( 'Minor releases (contain minor breaking changes)', 'v1.1.0', [
				'@ckeditor/ckeditor5-package-b',
				'@ckeditor/ckeditor5-package-c'
			] )
		];

		const result = await composeChangelog( {
			...options,
			releasedPackagesInfo,
			currentVersion: '1.0.0',
			newVersion: '2.0.0'
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
		const result = await composeChangelog( { ...options, isSinglePackage: true } );

		expect( result ).not.toContain( '### Released packages' );
	} );

	it( 'should include the complete changelog structure with details tag', async () => {
		const result = await composeChangelog( { ...options, currentVersion: '1.0.0', newVersion: '1.1.0' } );

		const detailsIndex = result.indexOf( '<details>' );
		const summaryIndex = result.indexOf( '<summary>Released packages (summary)</summary>' );
		const closeDetailsIndex = result.indexOf( '</details>' );

		expect( detailsIndex ).toBeGreaterThan( -1 );
		expect( summaryIndex ).toBeGreaterThan( detailsIndex );
		expect( closeDetailsIndex ).toBeGreaterThan( summaryIndex );
	} );
} );
