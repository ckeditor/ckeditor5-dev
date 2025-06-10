/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'os';
import { randomUUID } from 'crypto';
import fs from 'fs-extra';
import pacote from 'pacote';
import { manifest, packument } from '../../src/npm/pacotecacheless.js';

vi.mock( 'os' );
vi.mock( 'crypto' );
vi.mock( 'fs-extra' );
vi.mock( 'pacote' );

describe( 'pacote (no cache)', () => {
	beforeEach( () => {
		vi.mocked( os ).tmpdir.mockReturnValue( '/tmp' );
		vi.mocked( randomUUID ).mockReturnValue( 'a-1-b-2-c' );

		vi.mocked( fs ).ensureDir.mockResolvedValue();
		vi.mocked( fs ).remove.mockResolvedValue();
	} );

	describe( 'manifest()', () => {
		it( 'should be a function', () => {
			expect( manifest ).toBeTypeOf( 'function' );
		} );

		it( 'should create a temporary cache directory', async () => {
			await manifest( 'foo' );

			expect( vi.mocked( os ).tmpdir ).toHaveBeenCalledOnce();
			expect( vi.mocked( randomUUID ) ).toHaveBeenCalledOnce();
			expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalledExactlyOnceWith( '/tmp/pacote--a-1-b-2-c' );
		} );

		it( 'must create a cache directory before executing `pacote.manifest()`', async () => {
			await manifest( 'foo' );

			expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalledBefore( vi.mocked( pacote ).manifest );
		} );

		it( 'should pass a temporary cache directory to `pacote.manifest()`', async () => {
			await manifest( 'foo' );

			expect( vi.mocked( pacote ).manifest ).toHaveBeenCalledExactlyOnceWith(
				expect.any( String ),
				expect.objectContaining( {
					cache: '/tmp/pacote--a-1-b-2-c',
					memoize: false,
					preferOnline: true
				} ) );
		} );

		it( 'should pass arguments to `pacote.manifest()`', async () => {
			await manifest( 'foo', { foo: true, bar: false } );

			expect( vi.mocked( pacote ).manifest ).toHaveBeenCalledExactlyOnceWith(
				'foo',
				expect.objectContaining( {
					foo: true,
					bar: false
				} ) );
		} );

		it( 'should not allow overriding the cache parameters when executing `pacote.manifest()`', async () => {
			await manifest( 'foo', {
				cache: null as any,
				memoize: 1,
				preferOnline: 'never' as any
			} );

			expect( vi.mocked( pacote ).manifest ).toHaveBeenCalledExactlyOnceWith(
				expect.any( String ),
				expect.not.objectContaining( {
					cache: null,
					memoize: 1,
					preferOnline: 'never'
				} ) );
		} );

		it( 'should resolve with a value returned by `pacote.manifest()', async () => {
			const value = {
				status: 'success',
				data: {
					done: true
				}
			};

			vi.mocked( pacote ).manifest.mockResolvedValue( value as any );

			await expect( manifest( 'foo' ) ).resolves.toEqual( value );
		} );

		it( 'must remove a cache directory after executing `pacote.manifest()` (when resolved)', async () => {
			await manifest( 'foo' );

			expect( vi.mocked( fs ).remove ).toHaveBeenCalledAfter( vi.mocked( pacote ).manifest );
		} );

		it( 'must remove a cache directory after executing `pacote.manifest()` (when rejected)', async () => {
			vi.mocked( pacote ).manifest.mockRejectedValue( 'null' );

			await expect( manifest( 'foo' ) ).rejects.toThrow();

			expect( vi.mocked( fs ).remove ).toHaveBeenCalledAfter( vi.mocked( pacote ).manifest );
		} );
	} );

	describe( 'packument()', () => {
		it( 'should be a function', () => {
			expect( packument ).toBeTypeOf( 'function' );
		} );

		it( 'should create a temporary cache directory', async () => {
			await packument( 'foo' );

			expect( vi.mocked( os ).tmpdir ).toHaveBeenCalledOnce();
			expect( vi.mocked( randomUUID ) ).toHaveBeenCalledOnce();
			expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalledExactlyOnceWith( '/tmp/pacote--a-1-b-2-c' );
		} );

		it( 'must create a cache directory before executing `pacote.packument()`', async () => {
			await packument( 'foo' );

			expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalledBefore( vi.mocked( pacote ).packument );
		} );

		it( 'should pass a temporary cache directory to `pacote.packument()`', async () => {
			await packument( 'foo' );

			expect( vi.mocked( pacote ).packument ).toHaveBeenCalledExactlyOnceWith(
				expect.any( String ),
				expect.objectContaining( {
					cache: '/tmp/pacote--a-1-b-2-c',
					memoize: false,
					preferOnline: true
				} ) );
		} );

		it( 'should pass arguments to `pacote.packument()`', async () => {
			await packument( 'foo', { foo: true, bar: false } );

			expect( vi.mocked( pacote ).packument ).toHaveBeenCalledExactlyOnceWith(
				'foo',
				expect.objectContaining( {
					foo: true,
					bar: false
				} ) );
		} );

		it( 'should not allow overriding the cache parameters when executing `pacote.packument()`', async () => {
			await packument( 'foo', {
				cache: null as any,
				memoize: 1,
				preferOnline: 'never' as any
			} );

			expect( vi.mocked( pacote ).packument ).toHaveBeenCalledExactlyOnceWith(
				expect.any( String ),
				expect.not.objectContaining( {
					cache: null,
					memoize: 1,
					preferOnline: 'never'
				} ) );
		} );

		it( 'should resolve with a value returned by `pacote.packument()', async () => {
			const value = {
				status: 'success',
				data: {
					done: true
				}
			};

			vi.mocked( pacote ).packument.mockResolvedValue( value as any );

			await expect( packument( 'foo' ) ).resolves.toEqual( value );
		} );

		it( 'must remove a cache directory after executing `pacote.packument()` (when resolved)', async () => {
			await packument( 'foo' );

			expect( vi.mocked( fs ).remove ).toHaveBeenCalledAfter( vi.mocked( pacote ).packument );
		} );

		it( 'must remove a cache directory after executing `pacote.packument()` (when rejected)', async () => {
			vi.mocked( pacote ).packument.mockRejectedValue( 'null' );

			await expect( packument( 'foo' ) ).rejects.toThrow();

			expect( vi.mocked( fs ).remove ).toHaveBeenCalledAfter( vi.mocked( pacote ).packument );
		} );
	} );
} );
