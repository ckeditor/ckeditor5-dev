/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import resolvePublishOverrides from '../../lib/utils/resolvepublishoverrides.js';

vi.mock( 'node:fs/promises' );

describe( 'resolvePublishOverrides()', () => {
	it( 'should apply `publishConfig` overrides by replacing top-level fields', async () => {
		const packageJsonPath = '/repo/release/ckeditor5-foo/package.json';

		fs.readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			main: './dist/index.js',
			exports: { a: './a.js' },
			publishConfig: {
				main: './dist/publish.js',
				exports: { b: './b.js' }
			}
		} ) );

		await resolvePublishOverrides( packageJsonPath );

		expect( fs.readFile ).toHaveBeenCalledWith( packageJsonPath, 'utf8' );
		expect( fs.writeFile ).toHaveBeenCalledTimes( 1 );

		const [ writtenPath, writtenContent ] = fs.writeFile.mock.calls[ 0 ];

		expect( writtenPath ).toBe( packageJsonPath );

		// `exports` must be replaced entirely (no deep merge).
		const parsed = JSON.parse( writtenContent );

		expect( parsed ).toHaveProperty( 'name', 'ckeditor5-foo' );
		expect( parsed ).toHaveProperty( 'main', './dist/publish.js' );
		expect( parsed ).toHaveProperty( 'exports.b', './b.js' );

		expect( parsed ).not.toHaveProperty( 'exports.a' );
		expect( parsed ).not.toHaveProperty( 'publishConfig' );

		expect( writtenContent.endsWith( '\n' ) ).toBe( true );
	} );

	it( 'should not modify `package.json when `publishConfig` is `null`', async () => {
		const packageJsonPath = '/repo/release/ckeditor5-foo/package.json';

		fs.readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			main: './dist/index.js',
			publishConfig: null
		} ) );

		await resolvePublishOverrides( packageJsonPath );

		expect( fs.writeFile ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should not modify `package.json when `publishConfig` is missing', async () => {
		const packageJsonPath = '/repo/release/ckeditor5-foo/package.json';

		fs.readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			private: false,
			exports: { '.': './dist/index.js' }
		} ) );

		await resolvePublishOverrides( packageJsonPath );

		expect( fs.writeFile ).toHaveBeenCalledTimes( 0 );
	} );

	it.each( [
		[ 'array', [] ],
		[ 'string', 'nope' ],
		[ 'number', 123 ],
		[ 'boolean', true ],
		[ 'date', new Date( '2026-01-01T00:00:00Z' ) ]
	] )( 'should throw an error when `publishConfig` is not a plain object (checking %s)', async ( type, value ) => {
		const packageJsonPath = '/repo/release/ckeditor5-foo/package.json';

		fs.readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			publishConfig: value
		} ) );

		await expect( resolvePublishOverrides( packageJsonPath ) )
			.rejects
			.toThrowError( `"publishConfig" in "${ packageJsonPath }" must be a plain object.` );

		expect( fs.writeFile ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should propagate `JSON.parse` errors and does not write', async () => {
		const packageJsonPath = '/repo/release/ckeditor5-foo/package.json';

		fs.readFile.mockResolvedValue( '{not-valid-json' );

		await expect( resolvePublishOverrides( packageJsonPath ) ).rejects.toBeInstanceOf( SyntaxError );
		expect( fs.writeFile ).toHaveBeenCalledTimes( 0 );
	} );
} );
