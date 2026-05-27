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

const MANUAL_TEST_PATTERNS = [
	'packages/*/tests/manual/**/*.{html,js,md,ts}',
	'external/ckeditor5/packages/*/tests/manual/**/*.{html,js,md,ts}'
];
const MANUAL_ENTRIES_VIRTUAL_ID = 'virtual:ckeditor5-manual-entries';
const WORKSPACE_ROOT = process.cwd();
const MANUAL_THEME_ROOT = path.resolve( import.meta.dirname, '..', 'theme' );
const MANUAL_CATALOG_FILE_PATH = path.resolve( MANUAL_THEME_ROOT, 'catalog.html' );
const MANUAL_SHELL_TEMPLATE_FILE_PATH = path.resolve( MANUAL_THEME_ROOT, 'shell.html' );
const MANUAL_SHELL_SCRIPT_FILE_PATH = path.resolve( MANUAL_THEME_ROOT, 'shell.ts' );
const MANUAL_CATALOG_PUBLIC_PATH = toPublicFilePath( MANUAL_CATALOG_FILE_PATH, WORKSPACE_ROOT );
const MANUAL_SHELL_SCRIPT_PUBLIC_PATH = toPublicFilePath( MANUAL_SHELL_SCRIPT_FILE_PATH, WORKSPACE_ROOT );

export function createManualTestsPlugin(): Plugin {
	const manualPages = collectManualPages( MANUAL_TEST_PATTERNS, WORKSPACE_ROOT );
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
			server.middlewares.use( createManualStaticAssetsMiddleware( WORKSPACE_ROOT ) );

			server.middlewares.use( ( request, _response, next ) => {
				rewriteCatalogRequest( request );

				next();
			} );
		},

		configurePreviewServer( server ) {
			server.middlewares.use( createManualStaticAssetsMiddleware( WORKSPACE_ROOT ) );

			server.middlewares.use( ( request, _response, next ) => {
				rewriteCatalogRequest( request );

				next();
			} );
		},

		config() {
			return {
				build: {
					rolldownOptions: {
						input: [
							MANUAL_CATALOG_FILE_PATH,
							...[ ...manualPages.values() ].map( entry =>
								path.resolve( WORKSPACE_ROOT, entry.htmlFilePath.slice( 1 ) )
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
				const entry = getManualPageEntryForHtmlPath( manualPages, context.path );

				if ( !entry ) {
					return undefined;
				}

				return createManualShellHtml( {
					entry,
					html,
					shellScriptPublicPath: MANUAL_SHELL_SCRIPT_PUBLIC_PATH,
					shellTemplateFilePath: MANUAL_SHELL_TEMPLATE_FILE_PATH,
					workspaceRoot: WORKSPACE_ROOT
				} );
			}
		}
	};
}

function rewriteCatalogRequest( request: { url?: string } ): void {
	const requestPath = request.url?.split( '?' )[ 0 ];

	if ( requestPath == '/' || requestPath == '/index.html' ) {
		request.url = MANUAL_CATALOG_PUBLIC_PATH;
	}
}

function getFilePathFromId( id: string ): string {
	const queryIndex = id.indexOf( '?' );

	return queryIndex >= 0 ? id.slice( 0, queryIndex ) : id;
}

function getManualPageEntryForHtmlPath(
	manualPages: Map<string, ManualPageEntry>,
	requestPath: string
): ManualPageEntry | undefined {
	const filePath = getFilePathFromId( requestPath );
	const entry = manualPages.get( filePath );

	if ( entry ) {
		return entry;
	}

	if ( path.isAbsolute( filePath ) && filePath.startsWith( WORKSPACE_ROOT ) ) {
		return manualPages.get( toPublicSpecifier( path.relative( WORKSPACE_ROOT, filePath ) ) );
	}

	return undefined;
}
