/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { resolve, extname } from 'node:path';
import { globSync, statSync, createReadStream } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { toPublicSpecifier } from '../utils.js';

// Extensions handled by Vite's module/HTML pipeline, never served raw as static fixtures.
// `.manual.html` entries go through the HTML pipeline too, but plain `.html` fixtures must be
// served raw, so they are excluded by suffix in `isManualStaticAssetPath` rather than by extension.
const PROCESSED_MANUAL_TEST_EXTENSIONS = new Set( [ '.js', '.ts' ] );
const MANUAL_TEST_SUFFIX = '.manual.html';
const VITE_MODULE_QUERY_PARAMETERS = new Set( [
	'import',
	'raw',
	'url',
	'worker',
	'inline'
] );

type ManualStaticAssetsMiddleware = ( request: IncomingMessage, response: ServerResponse, next: () => void ) => void;

export function collectManualStaticAssets( patterns: Array<string>, workspaceRoot: string ): Map<string, string> {
	return new Map( patterns
		.map( pattern => `${ pattern.replace( /\/+$/, '' ) }/tests/manual/**/*` )
		.flatMap( pattern => globSync( pattern, { cwd: workspaceRoot } ) )
		.sort()
		.filter( relativeFilePath => statSync( resolve( workspaceRoot, relativeFilePath ), { throwIfNoEntry: false } )?.isFile() )
		.filter( isManualStaticAssetPath )
		.map( relativeFilePath => [
			toPublicSpecifier( relativeFilePath ),
			resolve( workspaceRoot, relativeFilePath )
		] )
	);
}

export function createManualStaticAssetsMiddleware( collectStaticAssets: () => Map<string, string> ): ManualStaticAssetsMiddleware {
	return ( request, response, next ) => {
		if ( request.method != 'GET' && request.method != 'HEAD' ) {
			next();

			return;
		}

		const publicPath = getManualStaticAssetPublicPath( request.url );
		const filePath = publicPath && collectStaticAssets().get( publicPath );
		const fileStats = filePath ? statSync( filePath, { throwIfNoEntry: false } ) : undefined;

		if ( !filePath || !fileStats?.isFile() ) {
			next();

			return;
		}

		response.statusCode = 200;
		response.setHeader( 'Content-Length', fileStats.size );
		response.setHeader( 'Content-Type', getContentType( extname( filePath ) ) );

		if ( request.method == 'HEAD' ) {
			response.end();

			return;
		}

		const fileStream = createReadStream( filePath );

		// Destroy the response when the file disappears mid-stream so the unhandled stream error does not crash the server.
		fileStream.on( 'error', () => response.destroy() );
		fileStream.pipe( response );
	};
}

function getManualStaticAssetPublicPath( requestUrl: string | undefined ): string | null {
	// @ts-expect-error Remove when we upgrade TypeScript and bump `target`.
	const url = URL.parse( requestUrl || '', 'http://localhost' );

	if ( !url ) {
		return null;
	}

	if ( [ ...url.searchParams.keys() ].some( key => VITE_MODULE_QUERY_PARAMETERS.has( key ) ) ) {
		return null;
	}

	const pathname = decodePathname( url.pathname );

	if ( !pathname || !isManualStaticAssetPath( pathname ) ) {
		return null;
	}

	return pathname;
}

function decodePathname( pathname: string ): string | null {
	try {
		return decodeURIComponent( pathname );
	} catch {
		return null;
	}
}

function isManualStaticAssetPath( filePath: string ): boolean {
	if ( filePath.endsWith( MANUAL_TEST_SUFFIX ) ) {
		return false;
	}

	return extname( filePath ) != '' && !PROCESSED_MANUAL_TEST_EXTENSIONS.has( extname( filePath ) );
}

function getContentType( extension: string ): string {
	switch ( extension ) {
		case '.avif':
			return 'image/avif';

		case '.css':
			return 'text/css; charset=utf-8';

		case '.gif':
			return 'image/gif';

		case '.htm':
		case '.html':
			return 'text/html; charset=utf-8';

		case '.ico':
			return 'image/x-icon';

		case '.jpg':
		case '.jpeg':
			return 'image/jpeg';

		case '.json':
		case '.map':
			return 'application/json; charset=utf-8';

		case '.mp3':
			return 'audio/mpeg';

		case '.mp4':
			return 'video/mp4';

		case '.png':
			return 'image/png';

		case '.svg':
			return 'image/svg+xml';

		case '.txt':
			return 'text/plain; charset=utf-8';

		case '.webp':
			return 'image/webp';

		case '.woff':
			return 'font/woff';

		case '.woff2':
			return 'font/woff2';

		default:
			return 'application/octet-stream';
	}
}
