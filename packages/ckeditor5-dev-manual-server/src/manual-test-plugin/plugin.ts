/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { posix, resolve, relative } from 'node:path';
import { parse, serialize } from 'parse5';
import { appendChild, getAttribute, isElementNode, query, removeNode, type Element, type Node } from '@parse5/tools';
import { collectManualPages } from './collect-pages.js';
import { collectManualStaticAssets, createManualStaticAssetsMiddleware } from './static-assets.js';
import { createManualShellHtml } from './shell-html.js';
import { cacheValue, stripLeadingSlash, toPosixPath, toPublicFilePath, toPublicSpecifier } from '../utils.js';
import type { Plugin, ViteDevServer } from 'vite';
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
	watcher?: ManualFileWatcherLike;
}

interface ManualFileWatcherLike {
	on( eventName: string, listener: ( filePath: string ) => void ): unknown;
}

interface BundledDevClientEnvironment {
	memoryFiles?: ManualMemoryFilesLike;
}

interface ManualMemoryFilesLike {
	get( filePath: string ): { source: string | Uint8Array } | undefined;
}

const MANUAL_FILE_SET_EVENTS = [ 'add', 'addDir', 'unlink', 'unlinkDir' ];
const MANUAL_FILE_SET_RELOAD_DEBOUNCE_DELAY = 100;
const MANUAL_ENTRIES_VIRTUAL_ID = 'virtual:ckeditor5-manual-entries';
const MANUAL_THEME_ROOT = realpathSync( fileURLToPath( import.meta.resolve( '@ckeditor/ckeditor5-dev-manual-server/theme' ) ) );
const MANUAL_CATALOG_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'catalog.html' );
const MANUAL_CATALOG_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'catalog.ts' );
const MANUAL_SHELL_TEMPLATE_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'shell.html' );
const MANUAL_SHELL_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'shell.ts' );

export function manualTestsPlugin( manualTestPatterns: Array<string> ): Plugin {
	let workspaceRoot = process.cwd();
	const manualPagePatterns = manualTestPatterns.map( toManualPagePattern );
	const manualPagesCache = cacheValue( () => collectManualPages( manualPagePatterns, workspaceRoot ) );
	const manualStaticAssetsCache = cacheValue( () => collectManualStaticAssets( manualTestPatterns, workspaceRoot ) );
	const getManualPages = manualPagesCache.get;
	const getManualStaticAssets = manualStaticAssetsCache.get;
	const invalidateManualFileCaches = () => {
		manualPagesCache.invalidate();
		manualStaticAssetsCache.invalidate();
	};
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
	const getManualEntriesJson = () => JSON.stringify( getClientEntries(), null, 2 );

	// Manual entries JSON last returned by the `load()` hook, used to detect changes to the manual test set.
	let servedManualEntriesJson: string | null = null;

	const reloadManualCatalogIfEntriesChanged = ( server: ViteDevServer ): void => {
		if ( servedManualEntriesJson == null ) {
			return;
		}

		const updatedManualEntriesJson = getManualEntriesJson();

		if ( updatedManualEntriesJson == servedManualEntriesJson ) {
			return;
		}

		servedManualEntriesJson = updatedManualEntriesJson;

		const clientEnvironment = server.environments.client;
		const virtualModule = clientEnvironment.moduleGraph?.getModuleById( resolvedVirtualModuleId );

		if ( virtualModule ) {
			clientEnvironment.moduleGraph.invalidateModule( virtualModule );
		}

		clientEnvironment.hot?.send( { type: 'full-reload' } );
	};

	const createManualFileSetChangeHandler = ( server: ViteDevServer ): ( () => void ) => {
		let reloadTimeout: ReturnType<typeof setTimeout> | undefined;

		return () => {
			invalidateManualFileCaches();

			clearTimeout( reloadTimeout );
			reloadTimeout = setTimeout( () => reloadManualCatalogIfEntriesChanged( server ), MANUAL_FILE_SET_RELOAD_DEBOUNCE_DELAY );
		};
	};

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

			invalidateManualFileCaches();

			config.build.rolldownOptions.input = getManualBuildInputs();
		},

		configureServer( server ) {
			const { memoryFiles } = server.environments.client as BundledDevClientEnvironment;

			useManualFileCacheInvalidation( server.watcher, createManualFileSetChangeHandler( server ) );
			useManualTestMiddlewares( server, getManualCatalogPublicPath, getManualStaticAssets );
			useBundledDevManualHtmlSource( memoryFiles, getManualPages, getManualShellScriptPublicPath, () => workspaceRoot );
		},

		configurePreviewServer( server ) {
			useManualCatalogMiddleware( server, getManualCatalogPublicPath );
		},

		resolveId( source ) {
			if ( source == MANUAL_ENTRIES_VIRTUAL_ID ) {
				return resolvedVirtualModuleId;
			}

			return null;
		},

		load( id ) {
			if ( id == resolvedVirtualModuleId ) {
				servedManualEntriesJson = getManualEntriesJson();

				return `export const manualTestEntries = ${ servedManualEntriesJson };`;
			}

			return null;
		},

		generateBundle() {
			for ( const [ publicPath, filePath ] of getManualStaticAssets() ) {
				this.emitFile( {
					type: 'asset',
					fileName: stripLeadingSlash( publicPath ),
					source: readFileSync( filePath )
				} );
			}
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

function useManualFileCacheInvalidation( watcher: ManualFileWatcherLike | undefined, invalidate: () => void ): void {
	for ( const eventName of MANUAL_FILE_SET_EVENTS ) {
		watcher?.on( eventName, invalidate );
	}
}

function useManualTestMiddlewares(
	server: ManualTestServerLike,
	getManualCatalogPublicPath: () => string,
	getManualStaticAssets: () => Map<string, string>
): void {
	server.middlewares.use( createManualStaticAssetsMiddleware( getManualStaticAssets ) );
	useManualCatalogMiddleware( server, getManualCatalogPublicPath );
}

function useManualCatalogMiddleware(
	server: ManualTestServerLike,
	getManualCatalogPublicPath: () => string
): void {
	server.middlewares.use( ( request: { url?: string }, _response: unknown, next: () => void ) => {
		rewriteCatalogRequest( request, getManualCatalogPublicPath() );

		next();
	} );
}

function useBundledDevManualHtmlSource(
	memoryFiles: ManualMemoryFilesLike | undefined,
	getManualPages: () => Map<string, ManualPageEntry>,
	getManualShellScriptPublicPath: () => string,
	getWorkspaceRoot: () => string
): void {
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
		const transformedSourceHtml = createManualShellHtml( {
			entry,
			html: readFileSync( resolve( workspaceRoot, stripLeadingSlash( entry.htmlFilePath ) ), 'utf8' ),
			shellScriptPublicPath,
			shellTemplateFilePath: MANUAL_SHELL_TEMPLATE_FILE_PATH,
			workspaceRoot
		} );
		const html = mergeBundledAssetTags( transformedSourceHtml, bundledHtml, entry, shellScriptPublicPath );

		return { source: html };
	};
}

function getFileSource( file: { source: string | Uint8Array } ): string {
	return typeof file.source == 'string' ? file.source : Buffer.from( file.source ).toString( 'utf8' );
}

function toManualPagePattern( pattern: string ): string {
	if ( /\.(?:html|js|md|ts|\{[^}]*\})$/.test( pattern ) ) {
		return pattern;
	}

	return `${ pattern }.{html,js,md,ts}`;
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
	const hasBundledShellAsset = bundledHead.childNodes.some( node => isBundledModuleAsset( node, 'shell' ) );

	for ( const node of [ ...sourceHead.childNodes ] ) {
		if (
			isSourceTestScript( node, testScriptFileName ) ||
			hasBundledShellAsset && isSourceShellScript( node, shellScriptPublicPath )
		) {
			removeNode( node );
		}
	}

	for ( const node of bundledHead.childNodes.filter( isBundledAssetTag ) ) {
		removeNode( node );
		appendChild( sourceHead, node );
	}

	return serialize( sourceDocument );
}

function isSourceTestScript( node: Node, testScriptFileName: string ): boolean {
	if ( !isElementNode( node ) || node.tagName != 'script' ) {
		return false;
	}

	const source = getAttribute( node, 'src' );

	if ( !source ) {
		return false;
	}

	return posix.basename( source ) == testScriptFileName;
}

function isSourceShellScript( node: Node, shellScriptPublicPath: string ): boolean {
	return isElementNode( node ) && node.tagName == 'script' && getAttribute( node, 'src' ) == shellScriptPublicPath;
}

function isBundledModuleAsset( node: Node, moduleName: string ): boolean {
	if ( !isElementNode( node ) ) {
		return false;
	}

	if ( node.tagName == 'script' ) {
		return isBundledModulePath( getAttribute( node, 'src' ), moduleName );
	}

	return node.tagName == 'link' && getAttribute( node, 'rel' ) == 'modulepreload' &&
		isBundledModulePath( getAttribute( node, 'href' ), moduleName );
}

function isBundledModulePath( path: string | null, moduleName: string ): boolean {
	return Boolean( path?.startsWith( `/assets/${ moduleName }-` ) );
}

function isBundledAssetTag( node: Node ): node is Element {
	if ( !isElementNode( node ) ) {
		return false;
	}

	return Boolean(
		node.tagName == 'script' && getAttribute( node, 'src' )?.startsWith( '/assets/' ) ||
		node.tagName == 'link' && getAttribute( node, 'href' )?.startsWith( '/assets/' )
	);
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
