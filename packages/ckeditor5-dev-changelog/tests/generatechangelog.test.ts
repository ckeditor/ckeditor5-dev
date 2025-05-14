/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateChangelog } from '../src/generatechangelog.js';
import { getPackageJsons } from '../src/utils/getreleasepackagespkgjsons.js';
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
import { getRepositoryUrl } from '../src/utils/external/getrepositoryurl.js';
import { getNewChangelog } from '../src/utils/getnewchangelog.js';
import { getDateFormatted } from '../src/utils/getdateformatted.js';
import { defaultTransformScope } from '../src/utils/defaulttransformscope.js';
import { getExternalRepositoriesWithDefaults } from '../src/utils/getexternalrepositorieswithdefaults.js';
import { removeScope } from '../src/utils/removescope.js';
import { SECTIONS } from '../src/constants.js';

vi.mock( '../src/utils/getreleasepackagespkgjsons.js' );
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
vi.mock( '../src/utils/external/getrepositoryurl.js' );
vi.mock( '../src/utils/getnewchangelog.js' );
vi.mock( '../src/utils/getdateformatted.js' );
vi.mock( '../src/utils/defaulttransformscope.js' );
vi.mock( '../src/utils/getexternalrepositorieswithdefaults.js' );
vi.mock( '../src/utils/removescope.js' );
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
		vi.mocked( getPackageJsons ).mockResolvedValue( [
			{ name: 'test-package', version: '1.0.0' }
		] );
		vi.mocked( getRepositoryUrl ).mockResolvedValue( 'https://github.com/ckeditor/ckeditor5' );
		vi.mocked( getPackageJson ).mockResolvedValue( { version: '1.0.0', name: 'test-package' } );
		vi.mocked( getDateFormatted ).mockReturnValue( 'March 26, 2024' );
		vi.mocked( defaultTransformScope ).mockImplementation( name => ( {
			displayName: name,
			npmUrl: `https://www.npmjs.com/package/${ name }`
		} ) );
		vi.mocked( getExternalRepositoriesWithDefaults ).mockReturnValue( [] );
		vi.mocked( getChangesetFilePaths ).mockResolvedValue( [
			{
				changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				skipLinks: false
			}
		] );
		vi.mocked( getChangesetsParsed ).mockResolvedValue( [
			{
				content: 'Test changeset',
				data: {
					type: 'Feature',
					scope: [ 'test-package' ],
					closes: [],
					see: []
				},
				changesetPath: '/home/ckeditor/.changelog/changeset-1.md',
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				skipLinks: false
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
			breaking: {
				title: SECTIONS.breaking.title,
				entries: []
			},
			feature: {
				title: SECTIONS.feature.title,
				entries: [
					{
						message: 'Test feature',
						data: {
							type: 'feature',
							scope: [ 'test-package' ],
							closes: [],
							see: [],
							mainContent: 'Test feature',
							restContent: []
						},
						changesetPath: '/home/ckeditor/.changelog/changeset-1.md'
					}
				]
			},
			fix: {
				title: SECTIONS.fix.title,
				entries: []
			},
			other: {
				title: SECTIONS.other.title,
				entries: []
			},
			invalid: {
				title: SECTIONS.invalid.title,
				entries: []
			}
		} );
		vi.mocked( getNewVersion ).mockResolvedValue( { newVersion: '1.0.1', isInternal: false } );
		vi.mocked( getSectionsToDisplay ).mockReturnValue( [
			{
				title: SECTIONS.feature.title,
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
						},
						changesetPath: '/home/ckeditor/.changelog/changeset-1.md'
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
		vi.mocked( getNewChangelog ).mockReturnValue( 'Mocked changelog content' );
		vi.mocked( removeScope ).mockImplementation( parsedChangesetFiles => {
			return parsedChangesetFiles.map( changeset => {
				delete changeset.data.scope;

				return changeset;
			} );
		} );
	} );

	it( 'generates changelog with all required sections', async () => {
		await generateChangelog( defaultOptions );

		expect( getExternalRepositoriesWithDefaults ).toHaveBeenCalledWith( [] );
		expect( getPackageJsons ).toHaveBeenCalledWith( '/home/ckeditor', 'packages', [] );
		expect( getDateFormatted ).toHaveBeenCalledWith( '2024-03-26' );

		// Check that getNewChangelog is called with correct arguments
		expect( getNewChangelog ).toHaveBeenCalledWith( {
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			dateFormatted: 'March 26, 2024',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [
				{
					title: SECTIONS.feature.title,
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
							},
							changesetPath: '/home/ckeditor/.changelog/changeset-1.md'
						}
					]
				}
			],
			releasedPackagesInfo: [
				{
					title: 'Released packages',
					version: '1.0.1',
					packages: [ 'test-package' ]
				}
			],
			isInternal: false,
			singlePackage: false,
			packageJsons: [
				{ name: 'test-package', version: '1.0.0' }
			]
		} );

		expect( modifyChangelog ).toHaveBeenCalledWith(
			'Mocked changelog content',
			'/home/ckeditor'
		);
		expect( removeChangesetFiles ).toHaveBeenCalledWith(
			[
				{
					changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
					gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
					skipLinks: false
				}
			],
			'/home/ckeditor',
			'.changelog',
			[]
		);
		expect( logInfo ).toHaveBeenCalledWith( '○ Done!' );
	} );

	it( 'generates changelog without scope when generating for a single package', async () => {
		await generateChangelog( { ...defaultOptions, singlePackage: true } );

		expect( getExternalRepositoriesWithDefaults ).toHaveBeenCalledWith( [] );
		expect( getPackageJsons ).toHaveBeenCalledWith( '/home/ckeditor', 'packages', [] );
		expect( getDateFormatted ).toHaveBeenCalledWith( '2024-03-26' );

		// Check that getNewChangelog is called with correct arguments
		expect( getNewChangelog ).toHaveBeenCalledWith( {
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			dateFormatted: 'March 26, 2024',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [
				{
					title: SECTIONS.feature.title,
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
							},
							changesetPath: '/home/ckeditor/.changelog/changeset-1.md'
						}
					]
				}
			],
			releasedPackagesInfo: [
				{
					title: 'Released packages',
					version: '1.0.1',
					packages: [ 'test-package' ]
				}
			],
			isInternal: false,
			singlePackage: true,
			packageJsons: [
				{ name: 'test-package', version: '1.0.0' }
			]
		} );

		expect( getSectionsWithEntries ).toHaveBeenCalledWith( {
			organisationNamespace: '@ckeditor',
			packageJsons: [ {
				name: 'test-package',
				version: '1.0.0'
			} ],
			parsedFiles: [ {
				changesetPath: '/home/ckeditor/.changelog/changeset-1.md',
				content: 'Test changeset',
				data: {
					closes: [],
					see: [],
					type: 'Feature'
				},
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				skipLinks: false
			} ],
			singlePackage: true,
			transformScope: expect.any( Function )
		} );

		expect( modifyChangelog ).toHaveBeenCalledWith(
			'Mocked changelog content',
			'/home/ckeditor'
		);
		expect( removeChangesetFiles ).toHaveBeenCalledWith(
			[
				{
					changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
					gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
					skipLinks: false
				}
			],
			'/home/ckeditor',
			'.changelog',
			[]
		);
		expect( logInfo ).toHaveBeenCalledWith( '○ Done!' );
	} );

	it( 'generates changelog and returns it instead of writing to a file in `returnChangelog` mode', async () => {
		const result = await generateChangelog( { ...defaultOptions, returnChangelog: true } );

		expect( getExternalRepositoriesWithDefaults ).toHaveBeenCalledWith( [] );
		expect( getPackageJsons ).toHaveBeenCalledWith( '/home/ckeditor', 'packages', [] );
		expect( getDateFormatted ).toHaveBeenCalledWith( '2024-03-26' );

		// Check that getNewChangelog is called with correct arguments
		expect( getNewChangelog ).toHaveBeenCalledWith( {
			oldVersion: '1.0.0',
			newVersion: '1.0.1',
			dateFormatted: 'March 26, 2024',
			gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
			sectionsToDisplay: [
				{
					title: SECTIONS.feature.title,
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
							},
							changesetPath: '/home/ckeditor/.changelog/changeset-1.md'
						}
					]
				}
			],
			releasedPackagesInfo: [
				{
					title: 'Released packages',
					version: '1.0.1',
					packages: [ 'test-package' ]
				}
			],
			isInternal: false,
			singlePackage: false,
			packageJsons: [
				{ name: 'test-package', version: '1.0.0' }
			]
		} );

		expect( modifyChangelog ).toHaveBeenCalledTimes( 0 );
		expect( removeChangesetFiles ).toHaveBeenCalledTimes( 0 );
		expect( logInfo ).toHaveBeenCalledWith( '○ Done!' );

		expect( result ).toEqual( 'Mocked changelog content' );
	} );

	it( 'handles first release (version 0.0.1)', async () => {
		vi.mocked( getPackageJson ).mockResolvedValue( { version: '0.0.1', name: 'test-package' } );

		await generateChangelog( defaultOptions );

		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			oldVersion: '0.0.1',
			newVersion: '1.0.1'
		} ) );
	} );

	it( 'handles external repositories', async () => {
		const externalRepositories = [ {
			cwd: '/external/repo',
			packagesDirectory: 'packages',
			skipLinks: false
		} ];

		vi.mocked( getExternalRepositoriesWithDefaults ).mockReturnValue( [ {
			cwd: '/external/repo',
			packagesDirectory: 'packages',
			skipLinks: false
		} ] );

		await generateChangelog( {
			...defaultOptions,
			skipLinks: true,
			externalRepositories
		} );

		expect( getExternalRepositoriesWithDefaults ).toHaveBeenCalledWith( externalRepositories );
		expect( getPackageJsons ).toHaveBeenCalledWith(
			'/home/ckeditor',
			'packages',
			[ {
				cwd: '/external/repo',
				packagesDirectory: 'packages',
				skipLinks: false
			} ]
		);
		expect( getChangesetFilePaths ).toHaveBeenCalledWith(
			'/home/ckeditor',
			'.changelog',
			[ {
				cwd: '/external/repo',
				packagesDirectory: 'packages',
				skipLinks: false
			} ],
			true
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
			[],
			false
		);
		expect( removeChangesetFiles ).toHaveBeenCalledWith(
			[
				{
					changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
					gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
					skipLinks: false
				}
			],
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
			breaking: {
				title: SECTIONS.breaking.title,
				entries: []
			},
			feature: {
				title: SECTIONS.feature.title,
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
						},
						changesetPath: '/home/ckeditor/.changelog/changeset-1.md',
						skipLinks: false
					}
				]
			},
			fix: {
				title: SECTIONS.fix.title,
				entries: []
			},
			other: {
				title: SECTIONS.other.title,
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

	it( 'handles internal changes correctly when getNewVersion returns isInternal: true', async () => {
		vi.mocked( getNewVersion ).mockResolvedValue( { newVersion: '1.0.1', isInternal: true } );

		await generateChangelog( defaultOptions );

		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			isInternal: true,
			newVersion: '1.0.1'
		} ) );
	} );

	it( 'handles nextVersion: "internal" correctly', async () => {
		// Mock getNewVersion to return isInternal: true for internal nextVersion
		vi.mocked( getNewVersion ).mockResolvedValue( { newVersion: '1.0.1', isInternal: true } );

		await generateChangelog( {
			...defaultOptions,
			nextVersion: 'internal'
		} );

		// In the actual implementation, getNewVersion is called with nextVersion 'internal'
		expect( getNewVersion ).toHaveBeenCalledWith( {
			sectionsWithEntries: expect.any( Object ),
			oldVersion: '1.0.0',
			packageName: 'test-package',
			nextVersion: 'internal',
			returnChangelog: false
		} );
		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			isInternal: true,
			newVersion: '1.0.1'
		} ) );
	} );

	it( 'handles sectionsToDisplay with valid entries when nextVersion is "internal"', async () => {
		// Mock getNewVersion to return isInternal: true for internal nextVersion
		vi.mocked( getNewVersion ).mockResolvedValue( { newVersion: '1.0.1', isInternal: true } );

		// Provide at least one section to display to avoid the error
		vi.mocked( getSectionsToDisplay ).mockReturnValue( [
			{
				title: SECTIONS.other.title,
				entries: [
					{
						message: 'Internal change',
						data: {
							type: 'Other',
							scope: [ 'test-package' ],
							closes: [],
							see: [],
							mainContent: 'Internal change',
							restContent: []
						},
						changesetPath: '/home/ckeditor/.changelog/changeset-internal.md'
					}
				]
			}
		] );

		await generateChangelog( {
			...defaultOptions,
			nextVersion: 'internal'
		} );

		expect( getNewVersion ).toHaveBeenCalledWith( {
			sectionsWithEntries: expect.any( Object ),
			oldVersion: '1.0.0',
			packageName: 'test-package',
			nextVersion: 'internal',
			returnChangelog: false
		} );
		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			isInternal: true,
			newVersion: '1.0.1',
			sectionsToDisplay: expect.any( Array )
		} ) );
		expect( modifyChangelog ).toHaveBeenCalled();
	} );
} );
