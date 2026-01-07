/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'node:util';
import { determineNextVersion, type DetermineNextVersionOptions } from '../../src/utils/determinenextversion.js';
import { provideNewVersion } from '../../src/utils/providenewversion.js';
import { logInfo } from '../../src/utils/loginfo.js';
import { detectReleaseChannel } from '../../src/utils/detectreleasechannel.js';
import { validateInputVersion } from '../../src/utils/validateinputversion.js';
import { InternalError } from '../../src/utils/internalerror.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Entry, SectionsWithEntries } from '../../src/types.js';

vi.mock( '../../src/utils/providenewversion.js' );
vi.mock( '../../src/utils/loginfo.js' );
vi.mock( '../../src/utils/detectreleasechannel.js' );
vi.mock( '../../src/utils/validateinputversion.js' );

describe( 'determineNextVersion()', () => {
	let options: DetermineNextVersionOptions;
	const mockedProvideNewVersion = vi.mocked( provideNewVersion );
	const mockedLogInfo = vi.mocked( logInfo );
	const mockedDetectReleaseChannel = vi.mocked( detectReleaseChannel );
	const mockedValidateInputVersion = vi.mocked( validateInputVersion );

	const createEntry = ( message: string ): Entry => ( {
		message,
		data: {
			mainContent: undefined,
			restContent: [],
			type: 'feature',
			scope: [],
			closes: [],
			see: [],
			validations: [],
			communityCredits: []
		},
		changesetPath: ''
	} );

	const createSectionsWithEntries = ( overrides: Partial<SectionsWithEntries> = {} ): SectionsWithEntries => ( {
		major: { entries: [], title: 'Major Breaking Changes' },
		minor: { entries: [], title: 'Minor Breaking Changes' },
		breaking: { entries: [], title: 'Breaking Changes' },
		feature: { entries: [], title: 'Features' },
		fix: { entries: [], title: 'Bug fixes' },
		other: { entries: [], title: 'Other changes' },
		warning: { entries: [], title: 'Warning' },
		invalid: { entries: [], title: 'Invalid changes' },
		...overrides
	} );

	beforeEach( () => {
		mockedDetectReleaseChannel.mockReturnValue( 'latest' );
		mockedValidateInputVersion.mockResolvedValue( true );

		options = {
			sections: createSectionsWithEntries(),
			currentVersion: '1.0.0',
			packageName: 'test-package',
			nextVersion: undefined,
			releaseType: 'latest'
		};
	} );

	it( 'should log the process start', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		await determineNextVersion( options );

		expect( mockedLogInfo ).toHaveBeenCalledWith( `○ ${ styleText( 'cyan', 'Determining the new version...' ) }` );
	} );

	it( 'should return a patch bump version when there are no breaking changes or feature entries', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		const result = await determineNextVersion( options );

		expect( result ).toBe( '1.0.1' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( {
			version: '1.0.0',
			packageName: 'test-package',
			bumpType: 'patch',
			displayValidationWarning: false,
			releaseChannel: 'latest',
			releaseType: 'latest'
		} );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should validate provided version if it is defined', async () => {
		options.nextVersion = '50.0.0';

		await determineNextVersion( options );

		expect( mockedLogInfo ).toHaveBeenCalledWith( `○ ${ styleText( 'cyan', 'Determined the next version to be 50.0.0.' ) }` );
		expect( mockedValidateInputVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			newVersion: '50.0.0',
			suggestedVersion: '50.0.0'
		} ) );
	} );

	it( 'should return provided version if it pass the validation', async () => {
		options.nextVersion = '50.0.0';

		const result = await determineNextVersion( options );

		expect( result ).toBe( '50.0.0' );
		expect( mockedProvideNewVersion ).not.toHaveBeenCalled();
		expect( mockedDetectReleaseChannel ).not.toHaveBeenCalled();
	} );

	it( 'should return provided nightly version without validation', async () => {
		options.nextVersion = '0.0.0-nightly-20250806.0';

		const result = await determineNextVersion( options );

		expect( result ).toBe( '0.0.0-nightly-20250806.0' );
		expect( mockedValidateInputVersion ).not.toHaveBeenCalled();
	} );

	it( 'should throw an error if provided version does not pass the validation', async () => {
		mockedValidateInputVersion.mockResolvedValue( 'Invalid version.' );

		options.nextVersion = '50.0.0';

		await determineNextVersion( options )
			.then(
				() => {
					throw new Error( 'Expected to throw.' );
				},
				err => {
					expect( err ).toBeInstanceOf( InternalError );
					expect( err.message ).to.equal( 'Invalid version.' );
				}
			);
	} );

	it( 'should return a minor bump version when "MINOR BREAKING CHANGE" entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.1.0' );

		options.sections = createSectionsWithEntries(
			{ minor: { entries: [ createEntry( 'Minor breaking change' ) ], title: 'Minor Breaking Changes' } }
		);

		const result = await determineNextVersion( options );

		expect( result ).toBe( '1.1.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			bumpType: 'minor'
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should return a minor bump version when Feature entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.1.0' );

		options.sections = createSectionsWithEntries(
			{ feature: { entries: [ createEntry( 'New feature' ) ], title: 'Features' } }
		);

		const result = await determineNextVersion( options );

		expect( result ).toBe( '1.1.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			bumpType: 'minor'
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should return a major bump version when "BREAKING CHANGE" entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		options.sections = createSectionsWithEntries(
			{ breaking: { entries: [ createEntry( 'Breaking change' ) ], title: 'Major Breaking Changes' } }
		);

		const result = await determineNextVersion( options );

		expect( result ).toBe( '2.0.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			bumpType: 'major'
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should return a major bump version when "MAJOR BREAKING CHANGE" entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		options.sections = createSectionsWithEntries(
			{ major: { entries: [ createEntry( 'Major breaking change' ) ], title: 'Major Breaking Changes' } }
		);

		const result = await determineNextVersion( options );

		expect( result ).toBe( '2.0.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			bumpType: 'major'
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should prioritize "MAJOR BREAKING CHANGE" version even if "MINOR BREAKING CHANGES" and feature entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '2.0.0' );

		options.sections = createSectionsWithEntries( {
			minor: { entries: [ createEntry( 'Some minor change' ) ], title: 'Minor Breaking Changes' },
			major: { entries: [ createEntry( 'Breaking change' ) ], title: 'Major Breaking Changes' },
			feature: { entries: [ createEntry( 'Some feature' ) ], title: 'Features' }
		} );

		const result = await determineNextVersion( options );

		expect( result ).toBe( '2.0.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			bumpType: 'major'
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should return a prerelease bump version when releaseType is prerelease', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.0-alpha.1' );
		options.releaseType = 'prerelease';
		options.sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( 'Major breaking change' ) ], title: 'Major Breaking Changes' },
			feature: { entries: [ createEntry( 'New feature' ) ], title: 'Features' }
		} );

		const result = await determineNextVersion( options );

		expect( result ).toBe( '1.0.0-alpha.1' );

		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			bumpType: 'prerelease'
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should call detectReleaseChannel with promotePrerelease=true when releaseType is prerelease-promote', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.0-beta.0' );
		options.releaseType = 'prerelease-promote';
		options.sections = createSectionsWithEntries( {
			major: { entries: [ createEntry( 'Major breaking change' ) ], title: 'Major Breaking Changes' }
		} );

		const result = await determineNextVersion( options );

		expect( result ).toBe( '1.0.0-beta.0' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			bumpType: 'prerelease'
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', true );
	} );

	it( 'should set displayValidationWarning to true when invalid entries are present', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		options.sections = createSectionsWithEntries(
			{ invalid: { entries: [ createEntry( 'Invalid change' ) ], title: 'Invalid changes' } }
		);

		const result = await determineNextVersion( options );

		expect( result ).toBe( '1.0.1' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			displayValidationWarning: true
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should set displayValidationWarning to true when entries have validations', async () => {
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.1' );

		const entryWithValidation = createEntry( 'Some change' );
		entryWithValidation.data.validations = [ 'Some validation warning' ];

		options.sections = createSectionsWithEntries(
			{ fix: { entries: [ entryWithValidation ], title: 'Bug fixes' } }
		);

		const result = await determineNextVersion( options );

		expect( result ).toBe( '1.0.1' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			displayValidationWarning: true
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );

	it( 'should use the release channel returned by detectReleaseChannel', async () => {
		mockedDetectReleaseChannel.mockReturnValue( 'beta' );
		mockedProvideNewVersion.mockResolvedValueOnce( '1.0.0-beta.1' );

		const result = await determineNextVersion( options );

		expect( result ).toBe( '1.0.0-beta.1' );
		expect( mockedProvideNewVersion ).toHaveBeenCalledWith( expect.objectContaining( {
			releaseChannel: 'beta'
		} ) );
		expect( mockedDetectReleaseChannel ).toHaveBeenCalledWith( '1.0.0', false );
	} );
} );
