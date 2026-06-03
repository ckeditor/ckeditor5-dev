/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { Writable } from 'node:stream';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	collectManualStaticAssets,
	createManualStaticAssetsMiddleware,
	getManualStaticAssetFilePath
} from '../../src/manual-test-plugin/static-assets.js';

describe( 'manual static assets', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await mkdtemp( join( tmpdir(), 'ckeditor5-manual-static-assets-' ) );
	} );

	afterEach( async () => {
		await rm( workspaceRoot, { recursive: true, force: true } );
	} );

	test( 'collects manual test assets from configured patterns', async () => {
		await Promise.all( [
			createFile( 'packages/ckeditor5-foo/tests/manual/assets/image.png' ),
			createFile( 'external/ckeditor5/packages/ckeditor5-bar/tests/manual/sample.jpg' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/styles.css' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/test.html' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/test.js' )
		] );

		const staticAssets = collectManualStaticAssets( [
			'packages/*/tests/manual/**/*',
			'external/ckeditor5/packages/*/tests/manual/**/*'
		], workspaceRoot );

		expect( [ ...staticAssets.entries() ] ).to.deep.equal( [
			[
				'/external/ckeditor5/packages/ckeditor5-bar/tests/manual/sample.jpg',
				join( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-bar/tests/manual/sample.jpg' )
			],
			[
				'/packages/ckeditor5-foo/tests/manual/assets/image.png',
				join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/assets/image.png' )
			]
		] );
	} );

	test( 'returns the collected file path for a request URL', () => {
		const staticAssets = new Map( [
			[ '/packages/ckeditor5-foo/tests/manual/assets/image.png', '/workspace/packages/ckeditor5-foo/tests/manual/assets/image.png' ]
		] );

		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/manual/assets/image.png?v=1',
			staticAssets
		) ).to.equal( '/workspace/packages/ckeditor5-foo/tests/manual/assets/image.png' );
	} );

	test( 'does not handle Vite module requests', () => {
		const staticAssets = new Map( [
			[ '/packages/ckeditor5-foo/tests/manual/assets/image.png', '/workspace/packages/ckeditor5-foo/tests/manual/assets/image.png' ]
		] );

		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/manual/assets/image.png?url',
			staticAssets
		) ).to.be.null;
	} );

	test( 'ignores unknown and invalid request URLs', () => {
		const staticAssets = new Map( [
			[ '/packages/ckeditor5-foo/tests/manual/assets/image.png', '/workspace/packages/ckeditor5-foo/tests/manual/assets/image.png' ]
		] );

		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/manual/missing.png',
			staticAssets
		) ).to.be.null;
		expect( getManualStaticAssetFilePath( 'http://%', staticAssets ) ).to.be.null;
		expect( getManualStaticAssetFilePath( undefined, staticAssets ) ).to.be.null;
	} );

	test( 'serves collected static assets', async () => {
		const filePath = await createFile( 'packages/ckeditor5-foo/tests/manual/assets/image.svg', '<svg></svg>' );
		const response = createResponse();
		const next = vi.fn();
		const middleware = createManualStaticAssetsMiddleware( new Map( [
			[ '/packages/ckeditor5-foo/tests/manual/assets/image.svg', filePath ]
		] ) );
		const finished = new Promise<void>( resolve => response.on( 'finish', resolve ) );

		middleware( {
			method: 'GET',
			url: '/packages/ckeditor5-foo/tests/manual/assets/image.svg'
		} as never, response as never, next );

		await finished;

		expect( next ).not.toHaveBeenCalled();
		expect( response.statusCode ).to.equal( 200 );
		expect( response.setHeader ).toHaveBeenCalledWith( 'Content-Length', 11 );
		expect( response.setHeader ).toHaveBeenCalledWith( 'Content-Type', 'image/svg+xml' );
		expect( response.getBody() ).to.equal( '<svg></svg>' );
	} );

	test( 'ends HEAD requests without streaming the static asset body', async () => {
		const filePath = await createFile( 'packages/ckeditor5-foo/tests/manual/assets/data.json', '{ "ok": true }' );
		const response = createResponse();
		const next = vi.fn();
		const middleware = createManualStaticAssetsMiddleware( new Map( [
			[ '/packages/ckeditor5-foo/tests/manual/assets/data.json', filePath ]
		] ) );
		const finished = new Promise<void>( resolve => response.on( 'finish', resolve ) );

		middleware( {
			method: 'HEAD',
			url: '/packages/ckeditor5-foo/tests/manual/assets/data.json'
		} as never, response as never, next );

		await finished;

		expect( next ).not.toHaveBeenCalled();
		expect( response.setHeader ).toHaveBeenCalledWith( 'Content-Type', 'application/json; charset=utf-8' );
		expect( response.getBody() ).to.equal( '' );
	} );

	test( 'passes through unsupported static asset requests', () => {
		const middleware = createManualStaticAssetsMiddleware( new Map() );
		const response = createResponse();
		const next = vi.fn();

		middleware( { method: 'POST', url: '/asset.png' } as never, response as never, next );
		middleware( { method: 'GET', url: '/missing.png' } as never, response as never, next );

		expect( next ).toHaveBeenCalledTimes( 2 );
	} );

	test( 'sets content types for supported static asset extensions', async () => {
		const cases = [
			[ 'image.avif', 'image/avif' ],
			[ 'styles.css', 'text/css; charset=utf-8' ],
			[ 'animation.gif', 'image/gif' ],
			[ 'favicon.ico', 'image/x-icon' ],
			[ 'photo.jpg', 'image/jpeg' ],
			[ 'photo.jpeg', 'image/jpeg' ],
			[ 'sound.mp3', 'audio/mpeg' ],
			[ 'video.mp4', 'video/mp4' ],
			[ 'image.png', 'image/png' ],
			[ 'readme.txt', 'text/plain; charset=utf-8' ],
			[ 'image.webp', 'image/webp' ],
			[ 'font.woff', 'font/woff' ],
			[ 'font.woff2', 'font/woff2' ],
			[ 'file.bin', 'application/octet-stream' ]
		] as const;

		for ( const [ fileName, contentType ] of cases ) {
			const requestPath = `/packages/ckeditor5-foo/tests/manual/assets/${ fileName }`;
			const filePath = await createFile( `packages/ckeditor5-foo/tests/manual/assets/${ fileName }`, '' );
			const response = createResponse();
			const middleware = createManualStaticAssetsMiddleware( new Map( [ [ requestPath, filePath ] ] ) );
			const finished = new Promise<void>( resolve => response.on( 'finish', resolve ) );

			middleware( { method: 'HEAD', url: requestPath } as never, response as never, vi.fn() );

			await finished;

			expect( response.setHeader ).toHaveBeenCalledWith( 'Content-Type', contentType );
		}
	} );

	async function createFile( relativeFilePath: string, content = '' ): Promise<string> {
		const filePath = join( workspaceRoot, relativeFilePath );

		await mkdir( dirname( filePath ), { recursive: true } );
		await writeFile( filePath, content );

		return filePath;
	}
} );

function createResponse(): Writable & {
	statusCode?: number;
	setHeader: ReturnType<typeof vi.fn>;
	getBody(): string;
} {
	const chunks: Array<Buffer> = [];
	const response = new Writable( {
		write( chunk: Buffer, _encoding, callback ) {
			chunks.push( Buffer.from( chunk ) );
			callback();
		}
	} ) as Writable & {
		statusCode?: number;
		setHeader: ReturnType<typeof vi.fn>;
		getBody(): string;
	};

	response.setHeader = vi.fn();
	response.getBody = () => Buffer.concat( chunks ).toString( 'utf8' );

	return response;
}
