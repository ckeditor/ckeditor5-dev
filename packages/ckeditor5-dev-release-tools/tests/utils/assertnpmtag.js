/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import assertNpmTag from '../../lib/utils/assertnpmtag.js';

vi.mock( 'fs-extra' );

describe( 'assertNpmTag()', () => {
	it( 'should resolve the promise if list of packages is empty', async () => {
		await assertNpmTag( [] );
	} );

	it( 'should read `package.json` from each package', async () => {
		vi.mocked( fs ).readJson.mockImplementation( input => {
			if ( input === 'ckeditor5-foo/package.json' ) {
				return Promise.resolve( {
					name: 'ckeditor5-foo',
					version: '1.0.0'
				} );
			}

			return Promise.resolve( {
				name: 'ckeditor5-bar',
				version: '0.0.1'
			} );
		} );

		await assertNpmTag( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'latest' );

		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( 'ckeditor5-foo/package.json' );
		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( 'ckeditor5-bar/package.json' );
	} );

	it( 'should not throw if version tag matches npm tag (both "latest")', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'latest' );
	} );

	it( 'should not throw if version tag matches npm tag (version tag = "latest", npm tag = "staging")', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'staging' );
	} );

	it( 'should not throw if version tag matches npm tag (both "alpha")', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			version: '1.0.0-alpha.0'
		} );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'alpha' );
	} );

	it( 'should not throw if version tag matches npm tag (both "nightly")', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			version: '0.0.0-nightly-20230517.0'
		} );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'nightly' );
	} );

	it( 'should throw if version tag does not match npm tag (version tag = "latest", npm tag = "alpha")', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'alpha' ) )
			.rejects.toThrow( 'The version tag "latest" from "ckeditor5-foo" package does not match the npm tag "alpha".' );
	} );

	it( 'should throw if version tag does not match npm tag (version tag = "latest", npm tag = "nightly")', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'nightly' ) )
			.rejects.toThrow( 'The version tag "latest" from "ckeditor5-foo" package does not match the npm tag "nightly".' );
	} );

	it( 'should throw if version tag does not match npm tag (version tag = "alpha", npm tag = "staging")', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			version: '1.0.0-alpha.0'
		} );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'staging' ) )
			.rejects.toThrow( 'The version tag "alpha" from "ckeditor5-foo" package does not match the npm tag "staging".' );
	} );

	it( 'should throw if version tag does not match npm tag (version tag = "nightly", npm tag = "staging")', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			version: '0.0.0-nightly-20230517.0'
		} );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'staging' ) )
			.rejects.toThrow( 'The version tag "nightly" from "ckeditor5-foo" package does not match the npm tag "staging".' );
	} );

	it( 'should throw one error for all packages with incorrect tags', async () => {
		vi.mocked( fs ).readJson.mockImplementation( input => {
			if ( input === 'ckeditor5-foo/package.json' ) {
				return Promise.resolve( {
					name: 'ckeditor5-foo',
					version: '1.0.0-alpha'
				} );
			}

			if ( input === 'ckeditor5-bar/package.json' ) {
				return Promise.resolve( {
					name: 'ckeditor5-bar',
					version: '0.0.0-nightly-20230517.0'
				} );
			}

			return Promise.resolve( {
				name: 'ckeditor5-baz',
				version: '0.0.1-rc.5'
			} );
		} );

		const errorMessage = 'The version tag "alpha" from "ckeditor5-foo" package does not match the npm tag "latest".\n' +
			'The version tag "nightly" from "ckeditor5-bar" package does not match the npm tag "latest".\n' +
			'The version tag "rc" from "ckeditor5-baz" package does not match the npm tag "latest".';

		await expect( assertNpmTag( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], 'latest' ) )
			.rejects.toThrow( errorMessage );
	} );
} );
