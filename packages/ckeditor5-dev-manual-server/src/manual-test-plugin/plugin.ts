/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { fileURLToPath } from 'node:url';
import { dirname, posix, resolve, relative } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse, serialize } from 'parse5';
import { appendChild, getAttribute, isElementNode, query, removeNode, type Element, type Node } from '@parse5/tools';
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
	environments?: {
		client?: {
			memoryFiles?: {
				get( filePath: string ): { source: string | Uint8Array } | undefined;
			};
		};
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
	let workspaceRoot = process.cwd();
	const manualPagePatterns = manualTestPatterns.map( pattern => `${ pattern }.{html,js,md,ts}` );
	const getManualPages = () => collectManualPages( manualPagePatterns, workspaceRoot );
	const getManualStaticAssets = () => collectManualStaticAssets( manualTestPatterns, workspaceRoot );
	const getManualPageEntryForFile = ( filePath: string ): ManualPageEntry | undefined => {
		return getManualPages().get( toPublicSpecifier( relative( workspaceRoot, filePath ) ) );
	};
	const getManualCatalogPublicPath = () => toPublicFilePath( MANUAL_CATALOG_FILE_PATH, workspaceRoot );
	const getManualCatalogScriptPublicPath = () => toPublicFilePath( MANUAL_CATALOG_SCRIPT_FILE_PATH, workspaceRoot );
	const getManualShellScriptPublicPath = () => toPublicFilePath( MANUAL_SHELL_SCRIPT_FILE_PATH, workspaceRoot );
	const getManualBuildInputs = () => [
		MANUAL_CATALOG_FILE_PATH,
		...[ ...getManualPages().values() ].map( entry => resolve( workspaceRoot, entry.htmlFilePath.slice( 1 ) ) )
	];
	const resolvedVirtualModuleId = `\0${ MANUAL_ENTRIES_VIRTUAL_ID }`;
	const getClientEntries = (): Array<ManualTestClientEntry> => [ ...getManualPages().values() ].map( entry => ( {
		displayName: entry.displayName,
		href: entry.htmlFilePath,
		packageName: entry.packageName,
		slug: entry.slug
	} ) );

	return {
		name: 'ckeditor5-manual-tests',

		config() {
			return {
				build: {
					rolldownOptions: {
						input: getManualBuildInputs()
					}
				}
			};
		},

		configResolved( config ) {
			workspaceRoot = config.root;

			config.build.rolldownOptions.input = getManualBuildInputs();
		},

		configureServer( server ) {
			useManualTestMiddlewares( server, getManualCatalogPublicPath, getManualStaticAssets );
			useBundledDevManualHtmlSource( server, getManualPages, getManualShellScriptPublicPath, () => workspaceRoot );
		},

		configurePreviewServer( server ) {
			useManualTestMiddlewares( server, getManualCatalogPublicPath, getManualStaticAssets );
		},

		resolveId( source ) {
			if ( source == MANUAL_ENTRIES_VIRTUAL_ID ) {
				return resolvedVirtualModuleId;
			}

			return null;
		},

		load( id ) {
			if ( id == resolvedVirtualModuleId ) {
				return `export const manualTestEntries = ${ JSON.stringify( getClientEntries(), null, 2 ) };`;
			}

			return null;
		},

		transformIndexHtml: {
			order: 'pre',

			handler( html, context ) {
				if ( toPosixPath( context.filename ) == toPosixPath( MANUAL_CATALOG_FILE_PATH ) ) {
					return html.replace( './catalog.ts', getManualCatalogScriptPublicPath() );
				}

				const entry = getManualPageEntryForFile( context.filename );

				if ( !entry ) {
					return undefined;
				}

				return createManualShellHtml( {
					entry,
					html,
					shellScriptPublicPath: getManualShellScriptPublicPath(),
					shellTemplateFilePath: MANUAL_SHELL_TEMPLATE_FILE_PATH,
					workspaceRoot
				} );
			}
		}
	};
}

function useManualTestMiddlewares(
	server: ManualTestServerLike,
	getManualCatalogPublicPath: () => string,
	getManualStaticAssets: () => Map<string, string>
): void {
	server.middlewares.use( createManualStaticAssetsMiddleware( getManualStaticAssets ) );

	server.middlewares.use( ( request: { url?: string }, _response: unknown, next: () => void ) => {
		rewriteCatalogRequest( request, getManualCatalogPublicPath() );

		next();
	} );
}

function useBundledDevManualHtmlSource(
	server: ManualTestServerLike,
	getManualPages: () => Map<string, ManualPageEntry>,
	getManualShellScriptPublicPath: () => string,
	getWorkspaceRoot: () => string
): void {
	const memoryFiles = server.environments?.client?.memoryFiles;

	if ( !memoryFiles ) {
		return;
	}

	const getBundledFile = memoryFiles.get.bind( memoryFiles );

	memoryFiles.get = ( filePath: string ) => {
		const file = getBundledFile( filePath );
		const entry = getManualPages().get( toPublicSpecifier( filePath ) );

		if ( !file || !entry ) {
			return file;
		}

		const workspaceRoot = getWorkspaceRoot();
		const shellScriptPublicPath = getManualShellScriptPublicPath();
		const bundledHtml = getFileSource( file );
		const html = mergeBundledAssetTags( createManualShellHtml( {
			entry,
			html: readFileSync( resolve( workspaceRoot, filePath ), 'utf8' ),
			shellScriptPublicPath,
			shellTemplateFilePath: MANUAL_SHELL_TEMPLATE_FILE_PATH,
			workspaceRoot
		} ), bundledHtml, entry, shellScriptPublicPath );

		return { source: html };
	};
}

function getFileSource( file: { source: string | Uint8Array } ): string {
	return typeof file.source == 'string' ? file.source : Buffer.from( file.source ).toString( 'utf8' );
}

function mergeBundledAssetTags(
	sourceHtml: string,
	bundledHtml: string,
	entry: ManualPageEntry,
	shellScriptPublicPath: string
): string {
	const sourceDocument = parse( sourceHtml );
	const bundledDocument = parse( bundledHtml );
	const sourceHead = getRequiredElementByTagName( sourceDocument, 'head' );
	const bundledHead = getRequiredElementByTagName( bundledDocument, 'head' );
	const testScriptFileName = posix.basename( entry.scriptFilePath );

	for ( const node of [ ...sourceHead.childNodes ] ) {
		if ( isSourceModuleScript( node, testScriptFileName, shellScriptPublicPath ) ) {
			removeNode( node );
		}
	}

	for ( const node of bundledHead.childNodes.filter( isBundledAssetTag ) ) {
		removeNode( node );
		appendChild( sourceHead, node );
	}

	return serialize( sourceDocument );
}

function isSourceModuleScript( node: Node, testScriptFileName: string, shellScriptPublicPath: string ): boolean {
	if ( !isElementNode( node ) || node.tagName != 'script' ) {
		return false;
	}

	const source = getAttribute( node, 'src' );

	if ( !source ) {
		return false;
	}

	return source == shellScriptPublicPath || posix.basename( source ) == testScriptFileName;
}

function isBundledAssetTag( node: Node ): node is Element {
	if ( !isElementNode( node ) ) {
		return false;
	}

	return node.tagName == 'script' && getAttribute( node, 'src' )?.startsWith( '/assets/' ) ||
		node.tagName == 'link' && getAttribute( node, 'href' )?.startsWith( '/assets/' );
}

function rewriteCatalogRequest( request: { url?: string }, manualCatalogPublicPath: string ): void {
	const url = parseRequestUrl( request.url );

	if ( !url ) {
		return;
	}

	if ( url.pathname == '/' || url.pathname == '/index.html' ) {
		request.url = `${ manualCatalogPublicPath }${ url.search }`;
	}
}

function parseRequestUrl( requestUrl: string | undefined ): URL | null {
	// @ts-expect-error Remove when we upgrade TypeScript and bump `target`.
	return URL.parse( requestUrl || '', 'http://localhost' );
}

function getRequiredElementByTagName( root: Node, tagName: string ): Element {
	return query<Element>( root, candidate => isElementNode( candidate ) && candidate.tagName == tagName )!;
}
