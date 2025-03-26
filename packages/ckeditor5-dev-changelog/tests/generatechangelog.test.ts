/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateChangelog } from '../src/generatechangelog.js';
import { getReleasePackagesPkgJsons } from '../src/utils/getreleasepackagespkgjsons.js';
import { getGitHubUrl } from '../src/utils/getgithuburl.js';
import { getPackageJson } from '../src/utils/getpackagejson.js';
import { getChangesetFilePaths } from '../src/utils/getchangesetfilepaths.js';
import { getChangesetsParsed } from '../src/utils/getchangesetsparsed.js';
import { getSectionsWithEntries } from '../src/utils/getsectionswithentries.js';
import { getNewVersion } from '../src/utils/getnewversion.js';
import { getSectionsToDisplay } from '../src/utils/getsectionstodisplay.js';
import { getReleasedPackagesInfo } from '../src/utils/getreleasedpackagesinfo.js';
import { modifyChangelog } from '../src/utils/modifychangelog.js';
import { removeChangesetFiles } from '../src/utils/removechangesetfiles.js';
import { logInfo } from '../src/utils/loginfo.js';
import { logChangelogFiles } from '../src/utils/logchangelogfiles.js';
import { SECTIONS } from '../src/constants.js';

vi.mock( '../src/utils/getreleasepackagespkgjsons.js' );
vi.mock( '../src/utils/getgithuburl.js' );
vi.mock( '../src/utils/getpackagejson.js' );
vi.mock( '../src/utils/getchangesetfilepaths.js' );
vi.mock( '../src/utils/getchangesetsparsed.js' );
vi.mock( '../src/utils/getsectionswithentries.js' );
vi.mock( '../src/utils/getnewversion.js' );
vi.mock( '../src/utils/getsectionstodisplay.js' );
vi.mock( '../src/utils/getreleasedpackagesinfo.js' );
vi.mock( '../src/utils/modifychangelog.js' );
vi.mock( '../src/utils/removechangesetfiles.js' );
vi.mock( '../src/utils/loginfo.js' );
vi.mock( '../src/utils/logchangelogfiles.js' );
vi.mock( 'chalk', () => ( {
	default: {
		yellow: ( text: string ) => text,
		green: ( text: string ) => text,
		cyan: ( text: string ) => text
	}
} ) );

describe( 'generateChangelog()', () => {
	const defaultOptions = {
		cwd: '/home/ckeditor',
		packagesDirectory: 'packages',
		transformScope: ( name: string ) => ( {
			displayName: name,
			npmUrl: `https://www.npmjs.com/package/${ name }`
		} ),
		date: '2024-03-26' as const
	};

	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( getReleasePackagesPkgJsons ).mockResolvedValue( [
			{ name: 'test-package', version: '1.0.0' }
		] );
		vi.mocked( getGitHubUrl ).mockResolvedValue( 'https://github.com/ckeditor/ckeditor5' );
		vi.mocked( getPackageJson ).mockResolvedValue( { version: '1.0.0', name: 'test-package' } );
		vi.mocked( getChangesetFilePaths ).mockResolvedValue( [ '/home/ckeditor/.changelog/changeset-1.md' ] );
		vi.mocked( getChangesetsParsed ).mockResolvedValue( [
			{
				content: 'Test changeset',
				data: {
					type: 'Feature',
					scope: [ 'test-package' ],
					closes: [],
					see: []
				}
			}
		] );
		vi.mocked( getSectionsWithEntries ).mockReturnValue( {
			major: {
				title: SECTIONS.major.title,
				entries: []
			},
			minor: {
				title: SECTIONS.minor.title,
				entries: []
			},
			Feature: {
				title: SECTIONS.Feature.title,
				entries: [
					{
						message: 'Test feature',
						data: {
							type: 'Feature',
							scope: [ 'test-package' ],
							closes: [],
							see: [],
							mainContent: 'Test feature',
							restContent: []
						}
					}
				]
			},
			Fix: {
				title: SECTIONS.Fix.title,
				entries: []
			},
			Other: {
				title: SECTIONS.Other.title,
				entries: []
			},
			invalid: {
				title: SECTIONS.invalid.title,
				entries: []
			}
		} );
		vi.mocked( getNewVersion ).mockResolvedValue( '1.0.1' );
		vi.mocked( getSectionsToDisplay ).mockReturnValue( [
			{
				title: SECTIONS.Feature.title,
				entries: [
					{
						message: 'Test feature',
						data: {
							type: 'Feature',
							scope: [ 'test-package' ],
							closes: [],
							see: [],
							mainContent: 'Test feature',
							restContent: []
						}
					}
				]
			}
		] );
		vi.mocked( getReleasedPackagesInfo ).mockResolvedValue( [
			{
				title: 'Released packages',
				version: '1.0.1',
				packages: [ 'test-package' ]
			}
		] );
	} );

	it( 'generates changelog with all required sections', async () => {
		await generateChangelog( defaultOptions );

		const expectedChangelog = [
			'## [1.0.1](https://github.com/ckeditor/ckeditor5/compare/v1.0.0...v1.0.1) (March 26, 2024)',
			'',
			'### Features',
			'',
			'Test feature',
			'',
			'### Released packages',
			'',
			'Check out the [Versioning policy](' +
				'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html' +
			') guide for more information.',
			'',
			'<details>',
			'<summary>Released packages (summary)</summary>',
			'',
			'Released packages',
			'',
			'* [test-package](https://www.npmjs.com/package/test-package/v/1.0.1): 1.0.1',
			'</details>',
			''
		].join( '\n' );

		expect( modifyChangelog ).toHaveBeenCalledWith(
			expect.stringContaining( expectedChangelog ),
			'/home/ckeditor'
		);
		expect( removeChangesetFiles ).toHaveBeenCalledWith(
			[ '/home/ckeditor/.changelog/changeset-1.md' ],
			'/home/ckeditor',
			'.changelog',
			[]
		);
		expect( logInfo ).toHaveBeenCalledWith( '📍 Done!' );
	} );

	it( 'handles first release (version 0.0.1)', async () => {
		vi.mocked( getPackageJson ).mockResolvedValue( { version: '0.0.1', name: 'test-package' } );

		await generateChangelog( defaultOptions );

		expect( modifyChangelog ).toHaveBeenCalledWith(
			expect.not.stringContaining( 'compare/v0.0.1...v1.0.1' ),
			'/home/ckeditor'
		);
	} );

	it( 'handles empty sections to display', async () => {
		vi.mocked( getSectionsToDisplay ).mockReturnValue( [] );

		await generateChangelog( defaultOptions );

		expect( logInfo ).toHaveBeenCalledWith( '📍 No walid packages to release found. Aborting.' );
		expect( modifyChangelog ).not.toHaveBeenCalled();
		expect( removeChangesetFiles ).not.toHaveBeenCalled();
	} );

	it( 'handles external repositories', async () => {
		const externalRepositories = [ {
			cwd: '/external/repo',
			packagesDirectory: 'packages'
		} ];

		await generateChangelog( {
			...defaultOptions,
			externalRepositories
		} );

		expect( getReleasePackagesPkgJsons ).toHaveBeenCalledWith(
			'/home/ckeditor',
			'packages',
			externalRepositories
		);
		expect( getChangesetFilePaths ).toHaveBeenCalledWith(
			'/home/ckeditor',
			'.changelog',
			externalRepositories
		);
	} );

	it( 'uses provided nextVersion instead of prompting', async () => {
		await generateChangelog( {
			...defaultOptions,
			nextVersion: '2.0.0'
		} );

		expect( getNewVersion ).not.toHaveBeenCalled();
		expect( modifyChangelog ).toHaveBeenCalledWith(
			expect.stringContaining( '## [2.0.0]' ),
			'/home/ckeditor'
		);
	} );

	it( 'uses custom changesets directory', async () => {
		await generateChangelog( {
			...defaultOptions,
			changesetsDirectory: 'custom/changesets'
		} );

		expect( getChangesetFilePaths ).toHaveBeenCalledWith(
			'/home/ckeditor',
			'custom/changesets',
			[]
		);
		expect( removeChangesetFiles ).toHaveBeenCalledWith(
			[ '/home/ckeditor/.changelog/changeset-1.md' ],
			'/home/ckeditor',
			'custom/changesets',
			[]
		);
	} );

	it( 'calls logChangelogFiles with correct sections', async () => {
		const sectionsWithEntries = {
			major: {
				title: SECTIONS.major.title,
				entries: []
			},
			minor: {
				title: SECTIONS.minor.title,
				entries: []
			},
			Feature: {
				title: SECTIONS.Feature.title,
				entries: [
					{
						message: 'Test feature',
						data: {
							type: 'Feature' as const,
							scope: [ 'test-package' ],
							closes: [],
							see: [],
							mainContent: 'Test feature',
							restContent: []
						}
					}
				]
			},
			Fix: {
				title: SECTIONS.Fix.title,
				entries: []
			},
			Other: {
				title: SECTIONS.Other.title,
				entries: []
			},
			invalid: {
				title: SECTIONS.invalid.title,
				entries: []
			}
		};

		vi.mocked( getSectionsWithEntries ).mockReturnValue( sectionsWithEntries );

		await generateChangelog( defaultOptions );

		expect( logChangelogFiles ).toHaveBeenCalledWith( sectionsWithEntries );
	} );
} );
