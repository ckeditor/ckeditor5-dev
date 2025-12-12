/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import assertNpmTag from '../../lib/utils/assertnpmtag.js';
import getNpmTagFromVersion from '../../lib/utils/getnpmtagfromversion.js';

vi.mock( 'fs/promises' );
vi.mock( '../../lib/utils/getnpmtagfromversion.js' );

describe( 'assertNpmTag()', () => {
	beforeEach( () => {
		vi.mocked( getNpmTagFromVersion ).mockReturnValue( 'latest' );
	} );

	it( 'should resolve the promise if list of packages is empty', async () => {
		await assertNpmTag( [] );
	} );

	it( 'should read `package.json` from each package', async () => {
		vi.mocked( fs ).readFile.mockImplementation( input => {
			if ( input === 'ckeditor5-foo/package.json' ) {
				return Promise.resolve( JSON.stringify( {
					name: 'ckeditor5-foo',
					version: '1.0.0'
				} ) );
			}

			return Promise.resolve( JSON.stringify( {
				name: 'ckeditor5-bar',
				version: '0.0.1'
			} ) );
		} );

		await assertNpmTag( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'latest' );

		expect( vi.mocked( fs ).readFile ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( 'ckeditor5-foo/package.json', 'utf-8' );
		expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( 'ckeditor5-bar/package.json', 'utf-8' );
	} );

	it( 'should not throw if version tag matches npm tag (both "latest")', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} ) );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'latest' );
	} );

	it( 'should not throw if version tag (latest) matches npm tag (staging)', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} ) );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'staging' );
	} );

	it( 'should not throw if version tag (latest) matches npm tag (next)', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} ) );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'next' );
	} );

	it( 'should not throw if version tag matches npm tag (both "alpha")', async () => {
		vi.mocked( getNpmTagFromVersion ).mockReturnValue( 'alpha' );

		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '1.0.0-alpha.0'
		} ) );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'alpha' );
	} );

	it( 'should not throw if version tag matches npm tag (both "nightly")', async () => {
		vi.mocked( getNpmTagFromVersion ).mockReturnValue( 'nightly' );

		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '0.0.0-nightly-20230517.0'
		} ) );

		await assertNpmTag( [ 'ckeditor5-foo' ], 'nightly' );
	} );

	it( 'should throw if version tag (latest) does not match npm tag (alpha)', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} ) );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'alpha' ) )
			.rejects.toThrow( 'The version tag "latest" from "ckeditor5-foo" package does not match the npm tag "alpha".' );
	} );

	it( 'should throw if version (latest) tag does not match npm tag (nightly)', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '1.0.0'
		} ) );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'nightly' ) )
			.rejects.toThrow( 'The version tag "latest" from "ckeditor5-foo" package does not match the npm tag "nightly".' );
	} );

	it( 'should throw if version tag (alpha) does not match npm tag (staging)', async () => {
		vi.mocked( getNpmTagFromVersion ).mockReturnValue( 'alpha' );

		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '1.0.0-alpha.0'
		} ) );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'staging' ) )
			.rejects.toThrow( 'The version tag "alpha" from "ckeditor5-foo" package does not match the npm tag "staging".' );
	} );

	it( 'should throw if version tag (nightly) does not match npm tag (staging)', async () => {
		vi.mocked( getNpmTagFromVersion ).mockReturnValue( 'nightly' );

		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '0.0.0-nightly-20230517.0'
		} ) );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'staging' ) )
			.rejects.toThrow( 'The version tag "nightly" from "ckeditor5-foo" package does not match the npm tag "staging".' );
	} );

	it( 'should throw if version tag (alpha) does not match npm tag (next)', async () => {
		vi.mocked( getNpmTagFromVersion ).mockReturnValue( 'alpha' );

		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '1.0.0-alpha.0'
		} ) );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'next' ) )
			.rejects.toThrow( 'The version tag "alpha" from "ckeditor5-foo" package does not match the npm tag "next".' );
	} );

	it( 'should throw if version tag (nightly) does not match npm tag (next)', async () => {
		vi.mocked( getNpmTagFromVersion ).mockReturnValue( 'nightly' );

		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			version: '0.0.0-nightly-20230517.0'
		} ) );

		await expect( assertNpmTag( [ 'ckeditor5-foo' ], 'next' ) )
			.rejects.toThrow( 'The version tag "nightly" from "ckeditor5-foo" package does not match the npm tag "next".' );
	} );

	it( 'should throw one error for all packages with incorrect tags', async () => {
		vi.mocked( getNpmTagFromVersion ).mockImplementation( input => {
			if ( input === '1.0.0-alpha' ) {
				return 'alpha';
			}
			if ( input === '0.0.0-nightly-20230517.0' ) {
				return 'nightly';
			}
			if ( input === '0.0.1-rc.5' ) {
				return 'rc';
			}
		} );

		vi.mocked( fs ).readFile.mockImplementation( input => {
			if ( input === 'ckeditor5-foo/package.json' ) {
				return Promise.resolve( JSON.stringify( {
					name: 'ckeditor5-foo',
					version: '1.0.0-alpha'
				} ) );
			}

			if ( input === 'ckeditor5-bar/package.json' ) {
				return Promise.resolve( JSON.stringify( {
					name: 'ckeditor5-bar',
					version: '0.0.0-nightly-20230517.0'
				} ) );
			}

			return Promise.resolve( JSON.stringify( {
				name: 'ckeditor5-baz',
				version: '0.0.1-rc.5'
			} ) );
		} );

		const errorMessage = 'The version tag "alpha" from "ckeditor5-foo" package does not match the npm tag "latest".\n' +
			'The version tag "nightly" from "ckeditor5-bar" package does not match the npm tag "latest".\n' +
			'The version tag "rc" from "ckeditor5-baz" package does not match the npm tag "latest".';

		await expect( assertNpmTag( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], 'latest' ) )
			.rejects.toThrow( errorMessage );
	} );
} );
