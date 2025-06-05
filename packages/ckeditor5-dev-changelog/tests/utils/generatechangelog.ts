/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { generateChangelog } from '../../src/utils/generatechangelog.js';
import { findPackages } from '../../src/utils/findpackages.js';
import { findChangelogEntryPaths } from '../../src/utils/findchangelogentrypaths.js';
import { parseChangelogEntries } from '../../src/utils/parsechangelogentries.js';
import { groupEntriesBySection } from '../../src/utils/groupentriesbysection.js';
import { getNewVersion } from '../../src/utils/getnewversion.js';
import { filterVisibleSections } from '../../src/utils/filtervisiblesections.js';
import { getReleasedPackagesInfo } from '../../src/utils/getreleasedpackagesinfo.js';
import { modifyChangelog } from '../../src/utils/modifychangelog.js';
import { removeChangelogEntryFiles } from '../../src/utils/removechangelogentryfiles.js';
import { logInfo } from '../../src/utils/loginfo.js';
import { displayChanges } from '../../src/utils/displaychanges.js';
import { getNewChangelog } from '../../src/utils/getnewchangelog.js';
import { commitChanges } from '../../src/utils/commitchanges.js';
import { SECTIONS } from '../../src/utils/constants.js';
import { InternalError } from '../../src/utils/internalerror.js';
import { UserAbortError } from '../../src/utils/useraborterror.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../src/utils/findpackages.js' );
vi.mock( '../../src/utils/findchangelogentrypaths.js' );
vi.mock( '../../src/utils/parsechangelogentries.js' );
vi.mock( '../../src/utils/groupentriesbysection.js' );
vi.mock( '../../src/utils/getnewversion.js' );
vi.mock( '../../src/utils/filtervisiblesections.js' );
vi.mock( '../../src/utils/getreleasedpackagesinfo.js' );
vi.mock( '../../src/utils/modifychangelog.js' );
vi.mock( '../../src/utils/removechangelogentryfiles.js' );
vi.mock( '../../src/utils/loginfo.js' );
vi.mock( '../../src/utils/displaychanges.js' );
vi.mock( '../../src/utils/getnewchangelog.js' );
vi.mock( '../../src/utils/commitchanges.js' );
vi.mock( 'chalk', () => ( {
	default: {
		green: ( text: string ) => text,
		red: ( text: string ) => text
	}
} ) );

describe( 'generateChangelog()', () => {
	const defaultOptions = {
		cwd: '/home/ckeditor',
		packagesDirectory: 'packages',
		isSinglePackage: false,
		transformScope: ( name: string ) => ( {
			displayName: name,
			npmUrl: `https://www.npmjs.com/package/${ name }`
		} ),
		date: '2024-03-26' as const
	};

	beforeEach( () => {
		vi.mocked( findPackages ).mockImplementation( () => Promise.resolve( new Map( [
			[ 'test-package', '1.0.0' ]
		] ) ) );
		vi.mocked( workspaces.getPackageJson ).mockImplementation( () => {
			return Promise.resolve( { version: '1.0.0', name: 'test-package' } as any ) as any;
		} );
		vi.mocked( findChangelogEntryPaths ).mockImplementation( () => Promise.resolve( [
			{
				filePaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				shouldSkipLinks: false,
				isRoot: true,
				cwd: '/home/ckeditor'
			}
		] ) );
		vi.mocked( parseChangelogEntries ).mockImplementation( () => Promise.resolve( [
			{
				content: 'Test changeset',
				data: {
					type: 'Feature',
					scope: [ 'test-package' ],
					closes: [],
					see: [],
					communityCredits: [],
					validations: []
				},
				changesetPath: '/home/ckeditor/.changelog/changeset-1.md',
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				shouldSkipLinks: false
			}
		] ) );
		vi.mocked( groupEntriesBySection ).mockReturnValue( {
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
							communityCredits: [],
							mainContent: 'Test feature',
							restContent: []
						} as any,
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
		vi.mocked( getNewVersion ).mockImplementation( () => Promise.resolve( { newVersion: '1.0.1', isInternal: false } ) );
		vi.mocked( filterVisibleSections ).mockReturnValue( [
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
							communityCredits: [],
							mainContent: 'Test feature',
							restContent: []
						} as any,
						changesetPath: '/home/ckeditor/.changelog/changeset-1.md'
					}
				]
			}
		] );
		vi.mocked( getReleasedPackagesInfo ).mockImplementation( () => Promise.resolve( [
			{
				title: 'Released packages',
				version: '1.0.1',
				packages: [ 'test-package' ]
			}
		] ) );
		vi.mocked( getNewChangelog ).mockImplementation( () => Promise.resolve( 'Mocked changelog content' ) );
		vi.mocked( modifyChangelog ).mockImplementation( () => Promise.resolve() );
		vi.mocked( removeChangelogEntryFiles ).mockImplementation( () => Promise.resolve() );
		vi.mocked( commitChanges ).mockImplementation( () => Promise.resolve() );
	} );

	it( 'uses async operations on `workspaces`', async () => {
		await generateChangelog( defaultOptions );

		expect( workspaces.getPackageJson ).toHaveBeenCalledWith(
			'/home/ckeditor',
			{ async: true }
		);
	} );

	it( 'formats the date correctly if not specified', async () => {
		const mockedDate = new Date( '2025-03-05T07:48:00Z' );
		vi.setSystemTime( mockedDate );

		const options = { ...defaultOptions };

		/* @ts-expect-error: TS2790 (testing the default date format) */
		delete options.date;

		await generateChangelog( options );

		expect( getNewChangelog ).toHaveBeenCalledWith(
			expect.objectContaining( {
				date: '2025-03-05'
			} )
		);

		vi.useRealTimers();
	} );

	it( 'uses the current working directory if not specified', async () => {
		const cwdSpy = vi.spyOn( process, 'cwd' )
			.mockReturnValue( '/home/ckeditor/workspaces/ckeditor5-dev' );

		const options = { ...defaultOptions };

		/* @ts-expect-error: TS2790 (testing the default date format) */
		delete options.cwd;

		await generateChangelog( options );

		expect( getNewChangelog ).toHaveBeenCalledWith(
			expect.objectContaining( {
				cwd: '/home/ckeditor/workspaces/ckeditor5-dev'
			} )
		);

		cwdSpy.mockRestore();
	} );

	it( 'generates a changelog based on the input files (a mono-repository)', async () => {
		await generateChangelog( defaultOptions );

		expect( findPackages ).toHaveBeenCalledWith( expect.objectContaining( {
			cwd: '/home/ckeditor',
			packagesDirectory: 'packages',
			externalRepositories: []
		} ) );

		expect( vi.mocked( groupEntriesBySection ) ).toHaveBeenCalledWith( expect.objectContaining( {
			transformScope: defaultOptions.transformScope
		} ) );

		expect( getNewChangelog ).toHaveBeenCalledWith(
			expect.objectContaining( {
				currentVersion: '1.0.0',
				newVersion: '1.0.1',
				sections: [
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
									communityCredits: [],
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
				isSinglePackage: false,
				packagesMetadata: new Map( [
					[ 'test-package', '1.0.0' ]
				] )
			} )
		);

		expect( modifyChangelog ).toHaveBeenCalledWith(
			'Mocked changelog content',
			'/home/ckeditor'
		);
		expect( removeChangelogEntryFiles ).toHaveBeenCalledWith( expect.objectContaining( {
			entryPaths: [
				{
					filePaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
					gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
					shouldSkipLinks: false,
					isRoot: true,
					cwd: '/home/ckeditor'
				}
			],
			cwd: '/home/ckeditor',
			externalRepositories: []
		} ) );
		expect( logInfo ).toHaveBeenCalledWith( '○ Done!' );
	} );

	it( 'processes changelog entries for a single package mode properly', async () => {
		await generateChangelog( { ...defaultOptions, isSinglePackage: true } );

		expect( vi.mocked( groupEntriesBySection ) ).toHaveBeenCalledWith( expect.objectContaining( {
			isSinglePackage: true
		} ) );

		expect( vi.mocked( getNewChangelog ) ).toHaveBeenCalledWith( expect.objectContaining( {
			isSinglePackage: true
		} ) );

		expect( vi.mocked( getNewChangelog ) ).toHaveBeenCalled();
		expect( vi.mocked( modifyChangelog ) ).toHaveBeenCalled();
	} );

	it( 'does not modify the file system `disableFilesystemOperations` is true', async () => {
		const result = await generateChangelog( { ...defaultOptions, disableFilesystemOperations: true } );

		expect( result ).toBe( 'Mocked changelog content' );
		expect( modifyChangelog ).toHaveBeenCalledTimes( 0 );
		expect( commitChanges ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'allows defining the external repositories', async () => {
		const externalRepositories = [ {
			cwd: '/external/repo',
			packagesDirectory: 'packages',
			shouldSkipLinks: false
		} ];

		await generateChangelog( {
			...defaultOptions,
			shouldSkipLinks: true,
			externalRepositories
		} );

		expect( findPackages ).toHaveBeenCalledWith( expect.objectContaining( {
			cwd: '/home/ckeditor',
			packagesDirectory: 'packages',
			externalRepositories
		} ) );
		expect( findChangelogEntryPaths ).toHaveBeenCalledWith( expect.objectContaining( {
			cwd: '/home/ckeditor',
			externalRepositories,
			shouldSkipLinks: true
		} ) );
	} );

	it( 'displays changes when a next version is not provided', async () => {
		const sections = {
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
							communityCredits: [],
							validations: [],
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
		};

		vi.mocked( groupEntriesBySection ).mockReturnValue( sections );

		await generateChangelog( defaultOptions );

		expect( displayChanges ).toHaveBeenCalledWith( expect.objectContaining( {
			sections
		} ) );
	} );

	it( 'does not display changes when a next version is provided', async () => {
		const sections = {
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
						changesetPath: '/home/ckeditor/.changelog/changeset-1.md'
					}
				]
			}
		};

		vi.mocked( groupEntriesBySection ).mockReturnValue( sections as any );

		await generateChangelog( {
			...defaultOptions,
			nextVersion: '1.0.1'
		} );

		expect( displayChanges ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'handles internal changes correctly (`internal` is a version provided by a user)', async () => {
		vi.mocked( getNewVersion ).mockImplementation( () => Promise.resolve( { newVersion: '1.0.1', isInternal: true } ) );

		await generateChangelog( defaultOptions );

		expect( getNewVersion ).toHaveBeenCalledWith( {
			sections: expect.any( Object ),
			currentVersion: '1.0.0',
			packageName: 'test-package'
		} );
		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			isInternal: true,
			newVersion: '1.0.1'
		} ) );
		expect( modifyChangelog ).toHaveBeenCalled();
	} );

	it( 'handles internal changes correctly (`internal` is specified as `nextVersion`)', async () => {
		vi.mocked( getNewVersion ).mockImplementation( () => Promise.resolve( { newVersion: '1.0.1', isInternal: true } ) );

		await generateChangelog( {
			...defaultOptions,
			nextVersion: 'internal'
		} );

		expect( getNewVersion ).toHaveBeenCalledWith( {
			sections: expect.any( Object ),
			currentVersion: '1.0.0',
			packageName: 'test-package',
			nextVersion: 'internal'
		} );
		expect( getNewChangelog ).toHaveBeenCalledWith( expect.objectContaining( {
			isInternal: true,
			newVersion: '1.0.1'
		} ) );
		expect( modifyChangelog ).toHaveBeenCalled();
	} );

	it( 'commits the removed the entry files and the updated changelog file', async () => {
		await generateChangelog( defaultOptions );

		expect( commitChanges ).toHaveBeenCalledWith( '1.0.1', [
			{
				cwd: '/home/ckeditor',
				isRoot: true,
				filePaths: [ '/home/ckeditor/.changelog/changeset-1.md' ]
			}
		] );
	} );

	it( 'commits the removed the entry files found in external repositories and the updated changelog file', async () => {
		const externalRepositories = [ {
			cwd: '/home/ckeditor5/external/ckeditor5-dev',
			packagesDirectory: 'packages',
			shouldSkipLinks: false
		} ];

		vi.mocked( findChangelogEntryPaths ).mockImplementation( () => Promise.resolve( [
			{
				filePaths: [ '/home/ckeditor/.changelog/changeset-1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				shouldSkipLinks: false,
				isRoot: true,
				cwd: '/home/ckeditor'
			},
			{
				filePaths: [ '/home/ckeditor5/external/ckeditor5-dev/.changelog/changeset-1.md' ],
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5-dev',
				shouldSkipLinks: false,
				cwd: '/home/ckeditor5/external/ckeditor5-dev',
				isRoot: false
			}
		] ) );

		await generateChangelog( {
			...defaultOptions,
			externalRepositories
		} );

		expect( commitChanges ).toHaveBeenCalledWith( '1.0.1', [
			{
				cwd: '/home/ckeditor',
				isRoot: true,
				filePaths: [
					'/home/ckeditor/.changelog/changeset-1.md'
				]
			},
			{
				cwd: '/home/ckeditor5/external/ckeditor5-dev',
				isRoot: false,
				filePaths: [
					'/home/ckeditor5/external/ckeditor5-dev/.changelog/changeset-1.md'
				]
			}
		] );
	} );

	describe( 'disableFilesystemOperations=true', () => {
		it( 'returns the changelog instead of writing to a file when in `disableFilesystemOperations=true` mode', async () => {
			await expect( generateChangelog( { ...defaultOptions, disableFilesystemOperations: true } ) )
				.resolves.toEqual( 'Mocked changelog content' );

			expect( modifyChangelog ).toHaveBeenCalledTimes( 0 );
			expect( commitChanges ).toHaveBeenCalledTimes( 0 );
		} );

		it( 'does not commit changes when in `disableFilesystemOperations=true` mode', async () => {
			await generateChangelog( { ...defaultOptions, disableFilesystemOperations: true } );

			expect( commitChanges ).toHaveBeenCalledTimes( 0 );
		} );
	} );

	describe( 'error handling', () => {
		let processMock: MockInstance<typeof process.exit>;
		let consoleMock: MockInstance<typeof console.error>;

		beforeEach( () => {
			processMock = vi.spyOn( process, 'exit' ).mockImplementation( ( () => {} ) as any );
			consoleMock = vi.spyOn( console, 'error' ).mockImplementation( () => {} );
		} );

		afterEach( () => {
			processMock.mockRestore();
			consoleMock.mockRestore();
		} );

		it( 'handles `InternalError` properly', async () => {
			// Mock `findPackages` to return a rejected promise with `InternalError`.
			vi.mocked( findPackages ).mockImplementation( () => {
				return Promise.reject( new InternalError() );
			} );

			// `generateChangelog()` does not throw expected errors.
			await generateChangelog( defaultOptions );

			expect( consoleMock ).toHaveBeenCalledTimes( 1 );
			expect( consoleMock ).toHaveBeenCalledWith(
				expect.stringContaining( 'No valid changesets found. Please verify that' )
			);
			expect( processMock ).toHaveBeenCalledTimes( 1 );
			expect( processMock ).toHaveBeenCalledWith( 1 );
		} );

		it( 'exits the program without errors when a user aborts typing a new version', async () => {
			vi.mocked( getNewVersion ).mockImplementation( () => {
				throw new TypeError( 'User force closed the prompt with SIGINT' );
			} );

			// `generateChangelog()` does not throw expected errors.
			await generateChangelog( defaultOptions );

			expect( consoleMock ).toHaveBeenCalledTimes( 0 );
			expect( processMock ).toHaveBeenCalledTimes( 1 );
			expect( processMock ).toHaveBeenCalledWith( 0 );
		} );

		it( 'exits the program without errors when a user aborts after detecting invalid changes', async () => {
			vi.mocked( getNewVersion ).mockImplementation( () => {
				throw new UserAbortError( 'Aborted while detecting invalid changes.' );
			} );

			// `generateChangelog()` does not throw expected errors.
			await generateChangelog( defaultOptions );

			expect( consoleMock ).toHaveBeenCalledTimes( 0 );
			expect( processMock ).toHaveBeenCalledTimes( 1 );
			expect( processMock ).toHaveBeenCalledWith( 0 );
		} );

		it( 'rethrows other errors', async () => {
			const processMock = vi.spyOn( process, 'exit' ).mockReturnValue( null as never );
			const consoleMock = vi.spyOn( console, 'error' ).mockReturnValue( null as never );

			vi.mocked( findPackages ).mockImplementation( () => {
				throw new Error();
			} );

			await expect( generateChangelog( defaultOptions ) ).rejects.toThrow();

			expect( processMock ).not.toBeCalled();
			expect( consoleMock ).not.toBeCalled();
		} );
	} );
} );
