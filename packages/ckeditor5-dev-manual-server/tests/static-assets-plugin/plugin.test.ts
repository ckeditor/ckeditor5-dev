/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { manualStaticAssetsPlugin } from '../../src/static-assets-plugin/plugin.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';

type ServerHook = ( server: { middlewares: { use: ReturnType<typeof vi.fn> } } ) => void;
type ConfigResolvedHook = ( config: { root: string } ) => void;
type GenerateBundleHook = ( this: { emitFile: ReturnType<typeof vi.fn> } ) => void;

describe( 'manualStaticAssetsPlugin()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await createTemporaryDirectory( 'ckeditor5-manual-static-assets-plugin-' );
		vi.spyOn( process, 'cwd' ).mockReturnValue( workspaceRoot );
	} );

	afterEach( async () => {
		await removeDirectory( workspaceRoot );
	} );

	test( 'registers the static assets middleware for dev server', () => {
		const plugin = manualStaticAssetsPlugin( { paths: [] } );
		const devServer = { middlewares: { use: vi.fn() } };

		( plugin.configureServer as unknown as ServerHook )( devServer );

		expect( devServer.middlewares.use ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'serves collected static assets in dev server', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/styles.css', 'body { color: red; }' );

		const plugin = manualStaticAssetsPlugin( { paths: [ 'packages/*/tests/manual/**/*' ] } );
		const devServer = { middlewares: { use: vi.fn() } };

		( plugin.configureServer as unknown as ServerHook )( devServer );

		const middleware = devServer.middlewares.use.mock.calls[ 0 ]![ 0 ] as (
			request: { method: string; url: string },
			response: unknown,
			next: () => void
		) => void;
		const next = vi.fn();
		const response = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() };

		middleware( { method: 'HEAD', url: '/packages/ckeditor5-foo/tests/manual/styles.css' }, response, next );

		expect( next ).not.toHaveBeenCalled();
		expect( response.statusCode ).to.equal( 200 );
		expect( response.setHeader ).toHaveBeenCalledWith( 'Content-Type', 'text/css; charset=utf-8' );
	} );

	test( 'emits manual static assets during build', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/assets/image.png', 'image' );

		const plugin = manualStaticAssetsPlugin( { paths: [ 'packages/*/tests/manual/**/*' ] } );
		const emitFile = vi.fn();

		( plugin.configResolved as unknown as ConfigResolvedHook )( { root: workspaceRoot } );
		( plugin.generateBundle as unknown as GenerateBundleHook ).call( { emitFile } );

		expect( emitFile ).toHaveBeenCalledWith( {
			type: 'asset',
			fileName: 'packages/ckeditor5-foo/tests/manual/assets/image.png',
			source: Buffer.from( 'image' )
		} );
	} );

	test( 'emits static assets only from included packages during build', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/assets/foo.png', 'foo image' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/assets/bar.png', 'bar image' )
		] );

		const plugin = manualStaticAssetsPlugin( {
			paths: [ 'packages/*/tests/manual/**/*' ],
			include: [ 'foo' ]
		} );
		const emitFile = vi.fn();

		( plugin.configResolved as unknown as ConfigResolvedHook )( { root: workspaceRoot } );
		( plugin.generateBundle as unknown as GenerateBundleHook ).call( { emitFile } );

		expect( emitFile ).toHaveBeenCalledWith( {
			type: 'asset',
			fileName: 'packages/ckeditor5-foo/tests/manual/assets/foo.png',
			source: Buffer.from( 'foo image' )
		} );
		expect( emitFile ).not.toHaveBeenCalledWith( expect.objectContaining( {
			fileName: 'packages/ckeditor5-bar/tests/manual/assets/bar.png'
		} ) );
	} );

	test( 'filters static assets using included full package names', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/assets/foo.png', 'foo image' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/assets/bar.png', 'bar image' )
		] );

		const plugin = manualStaticAssetsPlugin( {
			paths: [ 'packages/*/tests/manual/**/*' ],
			include: [ 'ckeditor5-foo' ]
		} );
		const emitFile = vi.fn();

		( plugin.configResolved as unknown as ConfigResolvedHook )( { root: workspaceRoot } );
		( plugin.generateBundle as unknown as GenerateBundleHook ).call( { emitFile } );

		expect( emitFile ).toHaveBeenCalledTimes( 1 );
		expect( emitFile ).toHaveBeenCalledWith( expect.objectContaining( {
			fileName: 'packages/ckeditor5-foo/tests/manual/assets/foo.png'
		} ) );
	} );

	test( 'ignores static assets outside manual test directories when filtering by package', async () => {
		await createFile( workspaceRoot, 'assets/image.png', 'image' );

		const plugin = manualStaticAssetsPlugin( {
			paths: [ 'assets/**/*' ],
			include: [ 'foo' ]
		} );
		const emitFile = vi.fn();

		( plugin.configResolved as unknown as ConfigResolvedHook )( { root: workspaceRoot } );
		( plugin.generateBundle as unknown as GenerateBundleHook ).call( { emitFile } );

		expect( emitFile ).not.toHaveBeenCalled();
	} );

	test( 'uses the Vite root instead of the current working directory', async () => {
		const currentWorkingDirectory = await createTemporaryDirectory( 'ckeditor5-manual-static-assets-plugin-cwd-' );

		try {
			vi.spyOn( process, 'cwd' ).mockReturnValue( currentWorkingDirectory );

			await Promise.all( [
				createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/assets/foo.png', 'foo image' ),
				createFile( currentWorkingDirectory, 'packages/ckeditor5-bar/tests/manual/assets/bar.png', 'bar image' )
			] );

			const plugin = manualStaticAssetsPlugin( { paths: [ 'packages/*/tests/manual/**/*' ] } );
			const emitFile = vi.fn();

			( plugin.configResolved as unknown as ConfigResolvedHook )( { root: workspaceRoot } );
			( plugin.generateBundle as unknown as GenerateBundleHook ).call( { emitFile } );

			expect( emitFile ).toHaveBeenCalledWith( expect.objectContaining( {
				fileName: 'packages/ckeditor5-foo/tests/manual/assets/foo.png'
			} ) );
			expect( emitFile ).not.toHaveBeenCalledWith( expect.objectContaining( {
				fileName: 'packages/ckeditor5-bar/tests/manual/assets/bar.png'
			} ) );
		} finally {
			await removeDirectory( currentWorkingDirectory );
		}
	} );
} );
