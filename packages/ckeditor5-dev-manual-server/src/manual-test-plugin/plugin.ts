/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { collectManualPages } from './collect-pages.js';
import { collectManualStaticAssets, createManualStaticAssetsMiddleware } from './static-assets.js';
import { createManualShellHtml } from './shell-html.js';
import { toPosixPath, toPublicFilePath, toPublicSpecifier } from '../utils.js';
import type { Plugin } from 'vite';
import type { ManualPageEntry } from './types.js';
export type { ManualData } from './types.js';

interface ManualTestClientEntry {
	displayName: string;
	href: string;
	packageName: string;
	slug: string;
}

interface ManualTestServerLike {
	middlewares: {
		use( middleware: unknown ): void;
	};
}

const PACKAGE_ROOT = dirname( fileURLToPath( import.meta.resolve( '@ckeditor/ckeditor5-dev-manual-server/package.json' ) ) );
const MANUAL_ENTRIES_VIRTUAL_ID = 'virtual:ckeditor5-manual-entries';
const MANUAL_THEME_ROOT = resolve( PACKAGE_ROOT, 'theme' );
const MANUAL_CATALOG_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'catalog.html' );
const MANUAL_CATALOG_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'catalog.ts' );
const MANUAL_SHELL_TEMPLATE_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'shell.html' );
const MANUAL_SHELL_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'shell.ts' );

export function manualTestsPlugin( manualTestPatterns: Array<string> ): Plugin {
	const workspaceRoot = process.cwd();
	const manualCatalogPublicPath = toPublicFilePath( MANUAL_CATALOG_FILE_PATH, workspaceRoot );
	const manualCatalogScriptPublicPath = toPublicFilePath( MANUAL_CATALOG_SCRIPT_FILE_PATH, workspaceRoot );
	const manualShellScriptPublicPath = toPublicFilePath( MANUAL_SHELL_SCRIPT_FILE_PATH, workspaceRoot );
	const manualPages = collectManualPages( manualTestPatterns.map( pattern => `${ pattern }.{html,js,md,ts}` ), workspaceRoot );
	const manualStaticAssets = collectManualStaticAssets( manualTestPatterns, workspaceRoot );
	const getManualPageEntryForFile = ( filePath: string ): ManualPageEntry | undefined => {
		return manualPages.get( toPublicSpecifier( relative( workspaceRoot, filePath ) ) );
	};
	const resolvedVirtualModuleId = `\0${ MANUAL_ENTRIES_VIRTUAL_ID }`;
	const clientEntries: Array<ManualTestClientEntry> = [ ...manualPages.values() ].map( entry => ( {
		displayName: entry.displayName,
		href: entry.htmlFilePath,
		packageName: entry.packageName,
		slug: entry.slug
	} ) );

	return {
		name: 'ckeditor5-manual-tests',

		configureServer( server ) {
			useManualTestMiddlewares( server, manualCatalogPublicPath, manualStaticAssets );
		},

		configurePreviewServer( server ) {
			useManualTestMiddlewares( server, manualCatalogPublicPath, manualStaticAssets );
		},

		config() {
			return {
				build: {
					rolldownOptions: {
						input: [
							MANUAL_CATALOG_FILE_PATH,
							...[ ...manualPages.values() ].map( entry => resolve( workspaceRoot, entry.htmlFilePath.slice( 1 ) ) )
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
				if ( toPosixPath( context.filename ) == toPosixPath( MANUAL_CATALOG_FILE_PATH ) ) {
					return html.replace( './catalog.ts', manualCatalogScriptPublicPath );
				}

				const entry = getManualPageEntryForFile( context.filename );

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
	manualCatalogPublicPath: string,
	manualStaticAssets: Map<string, string>
): void {
	server.middlewares.use( createManualStaticAssetsMiddleware( manualStaticAssets ) );

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
