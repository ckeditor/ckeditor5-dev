/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import { collectManualPages } from './collect-pages.js';
import { createManualStaticAssetsMiddleware } from './static-assets.js';
import { createManualShellHtml } from './shell-html.js';
import { toPublicFilePath, toPublicSpecifier } from '../utils.js';
import type { Plugin } from 'vite';
import type { ManualPageEntry } from './types.js';
export type { ManualData } from './types.js';

interface ManualTestClientEntry {
	displayName: string;
	href: string;
	packageName: string;
	packageShortName: string;
	slug: string;
	source: 'commercial' | 'oss';
}

interface ManualTestServerLike {
	middlewares: {
		use( middleware: unknown ): void;
	};
}

const MANUAL_TEST_PATTERNS = [
	'packages/*/tests/manual/**/*.{html,js,md,ts}',
	'external/ckeditor5/packages/*/tests/manual/**/*.{html,js,md,ts}'
];
const MANUAL_ENTRIES_VIRTUAL_ID = 'virtual:ckeditor5-manual-entries';
const MANUAL_THEME_ROOT = path.resolve( import.meta.dirname, '..', 'theme' );
const MANUAL_CATALOG_FILE_PATH = path.resolve( MANUAL_THEME_ROOT, 'catalog.html' );
const MANUAL_SHELL_TEMPLATE_FILE_PATH = path.resolve( MANUAL_THEME_ROOT, 'shell.html' );
const MANUAL_SHELL_SCRIPT_FILE_PATH = path.resolve( MANUAL_THEME_ROOT, 'shell.ts' );

export function manualTestsPlugin(): Plugin {
	const workspaceRoot = process.cwd();
	const manualCatalogPublicPath = toPublicFilePath( MANUAL_CATALOG_FILE_PATH, workspaceRoot );
	const manualShellScriptPublicPath = toPublicFilePath( MANUAL_SHELL_SCRIPT_FILE_PATH, workspaceRoot );
	const manualPages = collectManualPages( MANUAL_TEST_PATTERNS, workspaceRoot );
	const resolvedVirtualModuleId = `\0${ MANUAL_ENTRIES_VIRTUAL_ID }`;
	const clientEntries: Array<ManualTestClientEntry> = [ ...manualPages.values() ].map( entry => ( {
		displayName: entry.displayName,
		href: entry.htmlFilePath,
		packageName: entry.packageName,
		packageShortName: entry.packageName.replace( /^ckeditor5-/, '' ),
		slug: entry.slug,
		source: entry.source
	} ) );

	return {
		name: 'ckeditor5-manual-tests',

		configureServer( server ) {
			useManualTestMiddlewares( server, workspaceRoot, manualCatalogPublicPath );
		},

		configurePreviewServer( server ) {
			useManualTestMiddlewares( server, workspaceRoot, manualCatalogPublicPath );
		},

		config() {
			return {
				build: {
					rolldownOptions: {
						input: [
							MANUAL_CATALOG_FILE_PATH,
							...[ ...manualPages.values() ].map( entry =>
								path.resolve( workspaceRoot, entry.htmlFilePath.slice( 1 ) )
							)
						]
					}
				}
			};
		},

		resolveId( source ) {
			if ( source == MANUAL_ENTRIES_VIRTUAL_ID ) {
				return resolvedVirtualModuleId;
			}

			return null;
		},

		load( id ) {
			if ( id == resolvedVirtualModuleId ) {
				return `export const manualTestEntries = ${ JSON.stringify( clientEntries, null, 2 ) };`;
			}

			return null;
		},

		transformIndexHtml: {
			order: 'pre',

			handler( html, context ) {
				const entry = getManualPageEntryForHtmlPath( manualPages, context.path, workspaceRoot );

				if ( !entry ) {
					return undefined;
				}

				return createManualShellHtml( {
					entry,
					html,
					shellScriptPublicPath: manualShellScriptPublicPath,
					shellTemplateFilePath: MANUAL_SHELL_TEMPLATE_FILE_PATH,
					workspaceRoot
				} );
			}
		}
	};
}

function useManualTestMiddlewares(
	server: ManualTestServerLike,
	workspaceRoot: string,
	manualCatalogPublicPath: string
): void {
	server.middlewares.use( createManualStaticAssetsMiddleware( workspaceRoot ) );

	server.middlewares.use( ( request: { url?: string }, _response: unknown, next: () => void ) => {
		rewriteCatalogRequest( request, manualCatalogPublicPath );

		next();
	} );
}

function rewriteCatalogRequest( request: { url?: string }, manualCatalogPublicPath: string ): void {
	const requestPath = request.url?.split( '?' )[ 0 ];

	if ( requestPath == '/' || requestPath == '/index.html' ) {
		request.url = manualCatalogPublicPath;
	}
}

function getFilePathFromId( id: string ): string {
	const queryIndex = id.indexOf( '?' );

	return queryIndex >= 0 ? id.slice( 0, queryIndex ) : id;
}

function getManualPageEntryForHtmlPath(
	manualPages: Map<string, ManualPageEntry>,
	requestPath: string,
	workspaceRoot: string
): ManualPageEntry | undefined {
	const filePath = getFilePathFromId( requestPath );
	const entry = manualPages.get( filePath );

	if ( entry ) {
		return entry;
	}

	if ( path.isAbsolute( filePath ) && filePath.startsWith( workspaceRoot ) ) {
		return manualPages.get( toPublicSpecifier( path.relative( workspaceRoot, filePath ) ) );
	}

	return undefined;
}
