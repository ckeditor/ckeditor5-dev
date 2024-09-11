/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import assertPackages from '../../lib/utils/assertpackages.js';

vi.mock( 'fs-extra' );

describe( 'assertPackages()', () => {
	const disableMainValidatorOptions = {
		requireEntryPoint: false,
		optionalEntryPointPackages: []
	};

	it( 'should resolve the promise if list of packages is empty', async () => {
		await assertPackages( [], { ...disableMainValidatorOptions } );
	} );

	it( 'should check if `package.json` exists in each package', async () => {
		vi.mocked( fs ).pathExists.mockResolvedValue( true );

		await assertPackages( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], { ...disableMainValidatorOptions } );

		expect( vi.mocked( fs ).pathExists ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fs ).pathExists ).toHaveBeenCalledWith( 'ckeditor5-foo/package.json' );
		expect( vi.mocked( fs ).pathExists ).toHaveBeenCalledWith( 'ckeditor5-bar/package.json' );
		expect( vi.mocked( fs ).pathExists ).toHaveBeenCalledWith( 'ckeditor5-baz/package.json' );
	} );

	it( 'should throw one error for all packages with missing `package.json` file', async () => {
		vi.mocked( fs ).pathExists.mockImplementation( input => {
			if ( input === 'ckeditor5-bar/package.json' ) {
				return Promise.resolve( true );
			}

			return Promise.resolve( false );
		} );

		await expect( assertPackages( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], { ...disableMainValidatorOptions } ) )
			.rejects.toThrow(
				'The "package.json" file is missing in the "ckeditor5-foo" package.\n' +
				'The "package.json" file is missing in the "ckeditor5-baz" package.'
			);
	} );

	// See: https://github.com/ckeditor/ckeditor5/issues/15127.
	describe( 'the entry package point validator', () => {
		const enableMainValidatorOptions = {
			requireEntryPoint: true,
			optionalEntryPointPackages: [
				'@ckeditor/ckeditor5-bar'
			]
		};

		it( 'should throw if a package misses its entry point', async () => {
			vi.mocked( fs ).pathExists.mockResolvedValue( true );
			vi.mocked( fs ).readJson.mockImplementation( input => {
				if ( input === 'ckeditor5-foo/package.json' ) {
					return Promise.resolve( {
						name: '@ckeditor/ckeditor5-foo',
						main: 'src/index.ts'
					} );
				}

				if ( input === 'ckeditor5-bar/package.json' ) {
					return Promise.resolve( {
						name: '@ckeditor/ckeditor5-bar'
					} );
				}

				return Promise.resolve( {
					name: '@ckeditor/ckeditor5-baz'
				} );
			} );

			await expect( assertPackages( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], { ...enableMainValidatorOptions } ) )
				.rejects.toThrow(
					'The "@ckeditor/ckeditor5-baz" package misses the entry point ("main") definition in its "package.json".'
				);
		} );

		it( 'should pass the validator if specified package does not have to define the entry point', async () => {
			vi.mocked( fs ).pathExists.mockResolvedValue( true );
			vi.mocked( fs ).readJson.mockResolvedValue( {
				name: '@ckeditor/ckeditor5-bar'
			} );

			await assertPackages( [ 'ckeditor5-bar' ], { ...enableMainValidatorOptions } );
		} );
	} );
} );
