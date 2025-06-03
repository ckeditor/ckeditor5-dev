/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateChangelog } from '../src/generatechangelog.js';
import { findPackages } from '../src/utils/getreleasepackagespkgjsons.js';
import { getChangesetFilePaths } from '../src/utils/getchangesetfilepaths.js';
import { getInputParsed } from '../src/utils/getinputparsed.js';
import { getSectionsWithEntries } from '../src/utils/getsectionswithentries.js';
import { getNewVersion } from '../src/utils/getnewversion.js';
import { getSectionsToDisplay } from '../src/utils/getsectionstodisplay.js';
import { getReleasedPackagesInfo } from '../src/utils/getreleasedpackagesinfo.js';
import { modifyChangelog } from '../src/utils/modifychangelog.js';
import { removeChangesetFiles } from '../src/utils/removechangesetfiles.js';
import { logInfo } from '../src/utils/loginfo.js';
import { logChangelogFiles } from '../src/utils/logchangelogfiles.js';
import { getNewChangelog } from '../src/utils/getnewchangelog.js';
import { getDateFormatted } from '../src/utils/getdateformatted.js';
import { defaultTransformScope } from '../src/utils/defaulttransformscope.js';
import { utils } from '../src/utils/utils';
import { removeScope } from '../src/utils/removescope.js';
import { commitChanges } from '../src/utils/commitchanges.js';
import { SECTIONS } from '../src/utils/constants';
import { InternalError } from '../src/errors/internalerror.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../src/utils/getreleasepackagespkgjsons.js' );
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
vi.mock( '../src/utils/getnewchangelog.js' );
vi.mock( '../src/utils/getdateformatted.js' );
vi.mock( '../src/utils/defaulttransformscope.js' );
vi.mock( '../src/utils/getexternalrepositorieswithdefaults.js' );
vi.mock( '../src/utils/removescope.js' );
vi.mock( '../src/utils/commitchanges.js' );
vi.mock( 'chalk', () => ( {
	default: {
		yellow: ( text: string ) => text,
		green: ( text: string ) => text,
		cyan: ( text: string ) => text,
		red: ( text: string ) => text
	}
} ) );

describe( 'generateChangelog()', () => {
	// TODO: Missing tests for the default value of `cwd`.
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
		vi.mocked( findPackages ).mockResolvedValue( [
			{ name: 'test-package', version: '1.0.0' }
		] );
		vi.mocked( workspaces.getRepositoryUrl ).mockResolvedValue( 'https://github.com/ckeditor/ckeditor5' );
		vi.mocked( workspaces.getPackageJson ).mockResolvedValue( { version: '1.0.0', name: 'test-package' } );
		vi.mocked( getDateFormatted ).mockReturnValue( 'March 26, 2024' );
		vi.mocked( defaultTransformScope ).mockImplementation( name => ( {
			displayName: name,
			npmUrl: `https://www.npmjs.com/package/${ name }`
		} ) );
		vi.mocked( utils ).mockReturnValue( [] );
		vi.mocked( getChangesetFilePaths ).mockResolvedValue( [
			{
				changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				skipLinks: false,
				isRoot: true,
				cwd: '/home/ckeditor'
			}
		] );
		vi.mocked( getInputParsed ).mockResolvedValue( [
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
			warning: {
				title: SECTIONS.warning.title,
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
	} );

	it( 'uses async operations on `workspaces`', async () => {
		await generateChangelog( defaultOptions );

		expect( workspaces.getRepositoryUrl ).toHaveBeenCalledWith(
			'/home/ckeditor',
			{ async: true }
		);

		expect( workspaces.getPackageJson ).toHaveBeenCalledWith(
			'/home/ckeditor',
			{ async: true }
		);
	} );

	it( 'formats the date correctly', async () => {
		await generateChangelog( defaultOptions );

		expect( getDateFormatted ).toHaveBeenCalledWith( '2024-03-26' );

		expect( getNewChangelog ).toHaveBeenCalledWith(
			expect.objectContaining( {
				dateFormatted: 'March 26, 2024'
			} )
		);
	} );

	it( 'generates a changelog based on the input files (a mono-repository)', async () => {
		await generateChangelog( defaultOptions );

		expect( removeScope ).toHaveBeenCalledTimes( 0 );
		expect( utils ).toHaveBeenCalledWith( [] );
		expect( findPackages ).toHaveBeenCalledWith( '/home/ckeditor', 'packages', [] );

		expect( getNewChangelog ).toHaveBeenCalledWith(
			expect.objectContaining( {
				oldVersion: '1.0.0',
				newVersion: '1.0.1',
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
			} )
		);

		expect( modifyChangelog ).toHaveBeenCalledWith(
			'Mocked changelog content',
			'/home/ckeditor'
		);
		expect( removeChangesetFiles ).toHaveBeenCalledWith(
			[
				{
					changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
					gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
					skipLinks: false,
					isRoot: true,
					cwd: '/home/ckeditor'
				}
			],
			'/home/ckeditor',
			'.changelog',
			[]
		);
		expect( logInfo ).toHaveBeenCalledWith( '○ Done!' );
	} );

	it( 'removes the `scope` property from entries when generating for a single package', async () => {
		vi.mocked( removeScope ).mockReturnValue( [
			{
				changesetPath: '/home/ckeditor/.changelog/changeset-1.md',
				content: 'Test changeset'
			} as any
		] );

		await generateChangelog( { ...defaultOptions, singlePackage: true } );

		expect( vi.mocked( removeScope ) ).toHaveBeenCalledWith( [
			{
				changesetPath: '/home/ckeditor/.changelog/changeset-1.md',
				content: 'Test changeset',
				data: {
					closes: [],
					see: [],
					scope: [
						'test-package'
					],
					type: 'Feature'
				},
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				skipLinks: false
			}
		] );

		expect( vi.mocked( getSectionsWithEntries ) ).toHaveBeenCalledWith( expect.objectContaining( {
			parsedFiles: expect.arrayContaining( [
				{
					changesetPath: '/home/ckeditor/.changelog/changeset-1.md',
					content: 'Test changeset'
				}
			] )
		} ) );

		expect( vi.mocked( getNewChangelog ) ).toHaveBeenCalledWith( expect.objectContaining( {
			singlePackage: true
		} ) );

		expect( vi.mocked( getNewChangelog ) ).toHaveBeenCalled();
		expect( vi.mocked( modifyChangelog ) ).toHaveBeenCalled();
	} );

	it( 'does not delete input files when `removeInputFiles` is false', async () => {
		await generateChangelog( { ...defaultOptions, removeInputFiles: false } );

		expect( removeChangesetFiles ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'handles an initial release (version 0.0.1)', async () => {
		vi.mocked( workspaces.getPackageJson ).mockResolvedValue( { version: '0.0.1', name: 'test-package' } );

		await generateChangelog( defaultOptions );

		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			oldVersion: '0.0.1',
			newVersion: '1.0.1'
		} ) );
	} );

	it( 'allows defining the external repositories', async () => {
		const externalRepositories = [ {
			cwd: '/external/repo',
			packagesDirectory: 'packages',
			skipLinks: false
		} ];

		vi.mocked( utils ).mockReturnValue( [ {
			cwd: '/external/repo',
			packagesDirectory: 'packages',
			skipLinks: false
		} ] );

		await generateChangelog( {
			...defaultOptions,
			shouldSkipLinks: true,
			externalRepositories
		} );

		expect( utils ).toHaveBeenCalledWith( externalRepositories );
		expect( findPackages ).toHaveBeenCalledWith(
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
					skipLinks: false,
					isRoot: true,
					cwd: '/home/ckeditor'
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
			warning: {
				title: SECTIONS.warning.title,
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
		vi.mocked( getNewVersion ).mockResolvedValue( { newVersion: '1.0.1', isInternal: true } );

		await generateChangelog( {
			...defaultOptions,
			nextVersion: 'internal'
		} );

		expect( getNewVersion ).toHaveBeenCalledWith( {
			sectionsWithEntries: expect.any( Object ),
			oldVersion: '1.0.0',
			packageName: 'test-package',
			nextVersion: 'internal'
		} );
		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			isInternal: true,
			newVersion: '1.0.1'
		} ) );
	} );

	it( 'handles sectionsToDisplay with valid entries when nextVersion is "internal"', async () => {
		vi.mocked( getNewVersion ).mockResolvedValue( { newVersion: '1.0.1', isInternal: true } );

		// Provide at least one section to display to avoid the error.
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
			nextVersion: 'internal'
		} );
		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			isInternal: true,
			newVersion: '1.0.1',
			sectionsToDisplay: expect.any( Array )
		} ) );
		expect( modifyChangelog ).toHaveBeenCalled();
	} );

	it( 'commits the files updated or removed while generating changes', async () => {
		await generateChangelog( defaultOptions );

		expect( commitChanges ).toHaveBeenCalledWith( '1.0.1', [
			{
				cwd: '/home/ckeditor',
				isRoot: true,
				changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ]
			}
		] );
	} );

	it( 'commits the files updated or removed while generating changes including external changes', async () => {
		const externalRepositories = [ {
			cwd: '/home/ckeditor5/external/ckeditor5-dev',
			packagesDirectory: 'packages',
			skipLinks: false
		} ];

		vi.mocked( utils ).mockReturnValue( externalRepositories );

		vi.mocked( getChangesetFilePaths ).mockResolvedValue( [
			{
				changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				skipLinks: false,
				isRoot: true,
				cwd: '/home/ckeditor'
			},
			{
				...externalRepositories[ 0 ],
				changesetPaths: [ '/home/ckeditor5/external/ckeditor5-dev/.changelog/changeset-1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5-dev',
				skipLinks: false,
				cwd: '/home/ckeditor5/external/ckeditor5-dev',
				isRoot: false
			}
		] );

		await generateChangelog( {
			...defaultOptions,
			externalRepositories
		} );

		expect( utils ).toHaveBeenCalledWith( externalRepositories );

		expect( commitChanges ).toHaveBeenCalledWith( '1.0.1', [
			{
				cwd: '/home/ckeditor',
				isRoot: true,
				changesetPaths: [
					'/home/ckeditor/.changelog/changeset-1.md'
				]
			},
			{
				cwd: '/home/ckeditor5/external/ckeditor5-dev',
				isRoot: false,
				changesetPaths: [
					'/home/ckeditor5/external/ckeditor5-dev/.changelog/changeset-1.md'
				]
			}
		] );
	} );

	describe( 'noWrite=true', () => {
		it( 'returns the changelog instead of writing to a file when in `noWrite=true` mode', async () => {
			await expect( generateChangelog( { ...defaultOptions, noWrite: true } ) ).resolves.toEqual( 'Mocked changelog content' );

			expect( modifyChangelog ).toHaveBeenCalledTimes( 0 );
			expect( removeChangesetFiles ).toHaveBeenCalledWith(
				[
					{
						changesetPaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
						gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
						skipLinks: false,
						isRoot: true,
						cwd: '/home/ckeditor'
					}
				],
				'/home/ckeditor',
				'.changelog',
				[]
			);
		} );

		it( 'does not commit changes when in `noWrite=true` mode', async () => {
			await generateChangelog( { ...defaultOptions, noWrite: true } );

			expect( commitChanges ).toHaveBeenCalledTimes( 0 );
		} );
	} );

	it( 'handles InternalError properly', async () => {
		const processMock = vi.spyOn( process, 'exit' ).mockReturnValue( null as never );
		const consoleMock = vi.spyOn( console, 'error' ).mockReturnValue( null as never );

		vi.mocked( utils ).mockImplementation( () => {
			throw new InternalError();
		} );

		await generateChangelog( defaultOptions );

		expect( processMock ).toHaveBeenCalledOnce();
		expect( consoleMock ).toHaveBeenCalledOnce();

		processMock.mockRestore();
		processMock.mockRestore();
	} );

	it( 'rethrows other errors', async () => {
		const processMock = vi.spyOn( process, 'exit' ).mockReturnValue( null as never );
		const consoleMock = vi.spyOn( console, 'error' ).mockReturnValue( null as never );

		vi.mocked( utils ).mockImplementation( () => {
			throw new Error();
		} );

		await expect( generateChangelog( defaultOptions ) ).rejects.toThrow();

		expect( processMock ).not.toBeCalled();
		expect( consoleMock ).not.toBeCalled();

		processMock.mockRestore();
		processMock.mockRestore();
	} );
} );
