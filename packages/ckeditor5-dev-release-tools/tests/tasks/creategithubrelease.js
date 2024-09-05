/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Octokit } from '@octokit/rest';
import createGithubRelease from '../../lib/tasks/creategithubrelease';
import transformCommitUtils from '../../lib/utils/transformcommitutils';

vi.mock( '@octokit/rest', () => {
	const stubs = {
		getLatestRelease: vi.fn(),
		createRelease: vi.fn()
	};

	const octokitMock = vi.fn( () => ( {
		repos: {
			getLatestRelease: stubs.getLatestRelease,
			createRelease: stubs.createRelease
		}
	} ) );

	octokitMock.__stubs = stubs;

	return {
		Octokit: octokitMock
	};
} );
vi.mock( '../../lib/utils/transformcommitutils' );

describe( 'createGithubRelease()', () => {
	let options;

	beforeEach( () => {
		options = {
			token: 'abc123',
			version: '1.3.5',
			repositoryOwner: 'ckeditor',
			repositoryName: 'ckeditor5-dev',
			description: 'Very important release.'
		};

		vi.mocked( Octokit ).__stubs.getLatestRelease.mockRejectedValue( { status: 404 } );
		vi.mocked( Octokit ).__stubs.createRelease.mockResolvedValue();

		vi.mocked( transformCommitUtils.getRepositoryUrl ).mockReturnValue( 'https://github.com/ckeditor/ckeditor5-dev' );
	} );

	// afterEach( () => {
	// } );

	it( 'should be a function', () => {
		expect( createGithubRelease ).to.be.a( 'function' );
	} );

	it( 'creates new Octokit instance with correct arguments', async () => {
		await createGithubRelease( options );

		expect( vi.mocked( Octokit ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( Octokit ) ).toHaveBeenCalledWith( expect.objectContaining( {
			version: '3.0.0',
			auth: 'token abc123'
		} ) );
	} );

	it( 'resolves a url to the created page', async () => {
		const url = await createGithubRelease( options );

		expect( url ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev/releases/tag/v1.3.5' );
	} );

	it( 'creates a non-prerelease page when passing a major.minor.patch version', async () => {
		await createGithubRelease( options );

		const createReleaseMock = vi.mocked( Octokit ).__stubs.createRelease;

		expect( createReleaseMock ).toHaveBeenCalledOnce();
		expect( createReleaseMock ).toHaveBeenCalledWith( expect.objectContaining( {
			tag_name: 'v1.3.5',
			owner: 'ckeditor',
			repo: 'ckeditor5-dev',
			body: 'Very important release.',
			prerelease: false
		} ) );
	} );

	it( 'creates a prerelease page when passing a major.minor.patch-prerelease version', async () => {
		options.version = '1.3.5-alpha.0';
		await createGithubRelease( options );

		const createReleaseMock = vi.mocked( Octokit ).__stubs.createRelease;

		expect( createReleaseMock ).toHaveBeenCalledOnce();
		expect( createReleaseMock ).toHaveBeenCalledWith( expect.objectContaining( {
			tag_name: 'v1.3.5-alpha.0',
			owner: 'ckeditor',
			repo: 'ckeditor5-dev',
			body: 'Very important release.',
			prerelease: true
		} ) );
	} );

	it( 'creates a new release if the previous release version are different', async () => {
		vi.mocked( Octokit ).__stubs.getLatestRelease.mockResolvedValue( {
			data: {
				tag_name: 'v1.3.4'
			}
		} );

		await createGithubRelease( options );
		const createReleaseMock = vi.mocked( Octokit ).__stubs.createRelease;

		expect( createReleaseMock ).toHaveBeenCalledOnce();
	} );

	it( 'does not create a new release if the previous release version are the same', async () => {
		vi.mocked( Octokit ).__stubs.getLatestRelease.mockResolvedValue( {
			data: {
				tag_name: 'v1.3.5'
			}
		} );

		const url = await createGithubRelease( options );
		const createReleaseMock = vi.mocked( Octokit ).__stubs.createRelease;

		expect( url ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev/releases/tag/v1.3.5' );
		expect( createReleaseMock ).not.toHaveBeenCalled();
	} );
} );
