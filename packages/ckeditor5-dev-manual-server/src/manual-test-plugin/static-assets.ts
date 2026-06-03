/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { resolve, extname } from 'node:path';
import { globSync, statSync, createReadStream } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { toPublicSpecifier } from '../utils.js';

const PROCESSED_MANUAL_TEST_EXTENSIONS = new Set( [ '.html', '.js', '.md', '.ts' ] );
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
		.flatMap( pattern => globSync( pattern, { cwd: workspaceRoot } ) )
		.sort()
		.filter( relativeFilePath => statSync( resolve( workspaceRoot, relativeFilePath ) ).isFile() )
		.filter( isManualStaticAssetPath )
		.map( relativeFilePath => [
			toPublicSpecifier( relativeFilePath ),
			resolve( workspaceRoot, relativeFilePath )
		] )
	);
}

export function createManualStaticAssetsMiddleware( staticAssets: Map<string, string> ): ManualStaticAssetsMiddleware {
	return ( request, response, next ) => {
		if ( request.method != 'GET' && request.method != 'HEAD' ) {
			next();

			return;
		}

		const filePath = getManualStaticAssetFilePath( request.url, staticAssets );

		if ( !filePath ) {
			next();

			return;
		}

		const fileStats = statSync( filePath );

		response.statusCode = 200;
		response.setHeader( 'Content-Length', fileStats.size );
		response.setHeader( 'Content-Type', getContentType( path.extname( filePath ) ) );

		if ( request.method == 'HEAD' ) {
			response.end();

			return;
		}

		createReadStream( filePath ).pipe( response );
	};
}

export function getManualStaticAssetFilePath(
	requestUrl: string | undefined,
	staticAssets: Map<string, string>
): string | null {
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

	return staticAssets.get( url.pathname ) || null;
}

function isManualStaticAssetPath( filePath: string ): boolean {
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
