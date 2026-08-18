/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import validateGithubToken from '../../lib/utils/validategithubtoken.js';

const stubs = vi.hoisted( () => ( {
	constructor: vi.fn(),
	getRepository: vi.fn(),
	generateReleaseNotes: vi.fn()
} ) );

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '@octokit/rest', () => ( {
	Octokit: class {
		constructor( ...args ) {
			stubs.constructor( ...args );

			this.repos = {
				get: stubs.getRepository,
				generateReleaseNotes: stubs.generateReleaseNotes
			};
		}
	}
} ) );

describe( 'validateGithubToken()', () => {
	beforeEach( () => {
		vi.mocked( workspaces.getRepositoryUrl ).mockReturnValue( 'https://github.com/ckeditor/ckeditor5-dev' );
		stubs.getRepository.mockResolvedValue( {
			data: {
				default_branch: 'master'
			}
		} );
		stubs.generateReleaseNotes.mockResolvedValue();
	} );

	it( 'returns a normalized token that can generate release notes', async () => {
		await expect( validateGithubToken( '  github-token  ', { cwd: '/workspace' } ) ).resolves.toBe( 'github-token' );

		expect( workspaces.getRepositoryUrl ).toHaveBeenCalledExactlyOnceWith( '/workspace' );
		expect( stubs.constructor ).toHaveBeenCalledExactlyOnceWith( { auth: 'github-token' } );
		expect( stubs.getRepository ).toHaveBeenCalledExactlyOnceWith( {
			owner: 'ckeditor',
			repo: 'ckeditor5-dev'
		} );
		expect( stubs.generateReleaseNotes ).toHaveBeenCalledExactlyOnceWith( {
			owner: 'ckeditor',
			repo: 'ckeditor5-dev',
			tag_name: 'ckeditor5-dev-release-tools-token-validation',
			target_commitish: 'master'
		} );
	} );

	it( 'rejects an empty token without calling GitHub', async () => {
		await expect( validateGithubToken( '   ' ) ).rejects.toThrow( 'The token cannot be empty.' );

		expect( stubs.constructor ).not.toHaveBeenCalled();
	} );

	it( 'rejects an invalid or expired token', async () => {
		stubs.getRepository.mockRejectedValue( {
			status: 401,
			response: {
				data: {
					message: 'Bad credentials'
				}
			}
		} );

		await expect( validateGithubToken( 'github-token' ) )
			.rejects.toThrow(
				'GitHub API request for the "ckeditor/ckeditor5-dev" repository failed with HTTP 401: Bad credentials'
			);
	} );

	it( 'rejects a token that cannot access the repository', async () => {
		stubs.getRepository.mockRejectedValue( {
			status: 404,
			response: {
				data: {
					message: 'Not Found'
				}
			}
		} );

		await expect( validateGithubToken( 'github-token' ) )
			.rejects.toThrow(
				'GitHub API request for the "ckeditor/ckeditor5-dev" repository failed with HTTP 404: Not Found'
			);
	} );

	it( 'rejects a token without write access to the repository', async () => {
		stubs.generateReleaseNotes.mockRejectedValue( {
			status: 403,
			response: {
				data: {
					message: 'Resource not accessible by personal access token'
				}
			}
		} );

		await expect( validateGithubToken( 'github-token' ) )
			.rejects.toThrow(
				'GitHub API request for the "ckeditor/ckeditor5-dev" repository failed with HTTP 403: ' +
				'Resource not accessible by personal access token'
			);
	} );

	it( 'reports unexpected errors returned by GitHub', async () => {
		stubs.getRepository.mockRejectedValue( new Error( 'Network unavailable.' ) );

		await expect( validateGithubToken( 'github-token' ) )
			.rejects.toThrow(
				'Could not verify the token for the "ckeditor/ckeditor5-dev" repository: Network unavailable.'
			);
	} );
} );
