/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { toPosixPath } from '../utils.js';

const PROCESSED_MANUAL_TEST_EXTENSIONS = new Set( [ '.html', '.js', '.md', '.ts' ] );

const VITE_MODULE_QUERY_PARAMETERS = new Set( [
	'import',
	'raw',
	'url',
	'worker',
	'inline'
] );

type ManualStaticAssetsMiddleware = ( request: IncomingMessage, response: ServerResponse, next: () => void ) => void;

export function createManualStaticAssetsMiddleware( workspaceRoot: string ): ManualStaticAssetsMiddleware {
	return ( request, response, next ) => {
		if ( request.method != 'GET' && request.method != 'HEAD' ) {
			next();

			return;
		}

		const filePath = getManualStaticAssetFilePath( request.url, workspaceRoot );

		if ( !filePath ) {
			next();

			return;
		}

		let fileStats: fs.Stats;

		try {
			fileStats = fs.statSync( filePath );
		} catch {
			next();

			return;
		}

		if ( !fileStats.isFile() ) {
			next();

			return;
		}

		response.statusCode = 200;
		response.setHeader( 'Content-Length', fileStats.size );
		response.setHeader( 'Content-Type', getContentType( path.extname( filePath ) ) );

		if ( request.method == 'HEAD' ) {
			response.end();

			return;
		}

		fs.createReadStream( filePath ).pipe( response );
	};
}

export function getManualStaticAssetFilePath( requestUrl: string | undefined, workspaceRoot: string ): string | null {
	if ( !requestUrl ) {
		return null;
	}

	let url: URL;

	try {
		url = new URL( requestUrl, 'http://ckeditor5.local' );
	} catch {
		return null;
	}

	if ( [ ...url.searchParams.keys() ].some( key => VITE_MODULE_QUERY_PARAMETERS.has( key ) ) ) {
		return null;
	}

	let requestPath: string;

	try {
		requestPath = decodeURIComponent( url.pathname );
	} catch {
		return null;
	}

	if ( requestPath.includes( '\0' ) ) {
		return null;
	}

	const filePath = path.resolve( workspaceRoot, toPosixPath( requestPath ).replace( /^\/+/, '' ) );
	const relativeResolvedPath = path.relative( workspaceRoot, filePath );

	if ( relativeResolvedPath.startsWith( '..' ) || path.isAbsolute( relativeResolvedPath ) ) {
		return null;
	}

	const relativeFilePath = toPosixPath( relativeResolvedPath );

	if ( !isManualStaticAssetPath( relativeFilePath ) ) {
		return null;
	}

	return filePath;
}

function isManualStaticAssetPath( filePath: string ): boolean {
	const pathParts = filePath.split( '/' );
	const manualDirectoryIndex = pathParts.findIndex( ( part, index ) => part == 'manual' && pathParts[ index - 1 ] == 'tests' );

	if ( manualDirectoryIndex < 0 || manualDirectoryIndex == pathParts.length - 1 ) {
		return false;
	}

	const packageRootParts = pathParts.slice( 0, manualDirectoryIndex - 1 );
	const isCommercialPackage = packageRootParts.length == 2 && packageRootParts[ 0 ] == 'packages';
	const isOssPackage = packageRootParts.length == 4 &&
		packageRootParts[ 0 ] == 'external' &&
		packageRootParts[ 1 ] == 'ckeditor5' &&
		packageRootParts[ 2 ] == 'packages';

	if ( !isCommercialPackage && !isOssPackage ) {
		return false;
	}

	const extension = path.posix.extname( filePath );

	return extension != '' && !PROCESSED_MANUAL_TEST_EXTENSIONS.has( extension );
}

function getContentType( extension: string ): string {
	switch ( extension ) {
		case '.avif':
			return 'image/avif';

		case '.css':
			return 'text/css; charset=utf-8';

		case '.gif':
			return 'image/gif';

		case '.ico':
			return 'image/x-icon';

		case '.jpg':
		case '.jpeg':
			return 'image/jpeg';

		case '.json':
		case '.map':
			return 'application/json; charset=utf-8';

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
