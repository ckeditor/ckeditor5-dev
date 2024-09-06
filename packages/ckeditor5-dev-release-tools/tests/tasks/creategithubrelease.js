/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import createGithubRelease from '../../lib/tasks/creategithubrelease';
import transformCommitUtils from '../../lib/utils/transformcommitutils';

const stubs = vi.hoisted( () => ( {
	constructor: vi.fn(),
	getLatestRelease: vi.fn(),
	createRelease: vi.fn()
} ) );

vi.mock( '@octokit/rest', () => ( {
	Octokit: class {
		constructor( ...args ) {
			stubs.constructor( ...args );

			this.repos = {
				getLatestRelease: stubs.getLatestRelease,
				createRelease: stubs.createRelease
			};
		}
	}
} ) );

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

		stubs.getLatestRelease.mockRejectedValue( { status: 404 } );
		stubs.createRelease.mockResolvedValue();

		vi.mocked( transformCommitUtils.getRepositoryUrl ).mockReturnValue( 'https://github.com/ckeditor/ckeditor5-dev' );
	} );

	it( 'should be a function', () => {
		expect( createGithubRelease ).to.be.a( 'function' );
	} );

	it( 'creates new Octokit instance with correct arguments', async () => {
		await createGithubRelease( options );

		expect( stubs.constructor ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
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

		const createReleaseMock = stubs.createRelease;

		expect( createReleaseMock ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
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

		const createReleaseMock = stubs.createRelease;

		expect( createReleaseMock ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			tag_name: 'v1.3.5-alpha.0',
			owner: 'ckeditor',
			repo: 'ckeditor5-dev',
			body: 'Very important release.',
			prerelease: true
		} ) );
	} );

	it( 'creates a new release if the previous release version are different', async () => {
		stubs.getLatestRelease.mockResolvedValue( {
			data: {
				tag_name: 'v1.3.4'
			}
		} );

		await createGithubRelease( options );

		expect( stubs.createRelease ).toHaveBeenCalledOnce();
	} );

	it( 'does not create a new release if the previous release version are the same', async () => {
		stubs.getLatestRelease.mockResolvedValue( {
			data: {
				tag_name: 'v1.3.5'
			}
		} );

		const url = await createGithubRelease( options );

		expect( url ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev/releases/tag/v1.3.5' );
		expect( stubs.createRelease ).not.toHaveBeenCalled();
	} );
} );
