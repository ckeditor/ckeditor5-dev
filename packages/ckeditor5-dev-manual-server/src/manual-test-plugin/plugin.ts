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

interface BundledDevClientEnvironment {
	memoryFiles?: ManualMemoryFilesLike;
}

interface ManualMemoryFilesLike {
	get( filePath: string ): { source: string | Uint8Array } | undefined;
}

const MANUAL_ENTRIES_VIRTUAL_ID = 'virtual:ckeditor5-manual-entries';
const MANUAL_THEME_ROOT = realpathSync( fileURLToPath( import.meta.resolve( '@ckeditor/ckeditor5-dev-manual-server/theme' ) ) );
const MANUAL_CATALOG_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'catalog.html' );
const MANUAL_CATALOG_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'catalog.ts' );
const MANUAL_SHELL_TEMPLATE_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'shell.html' );
const MANUAL_SHELL_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'shell.ts' );

export function manualTestsPlugin( manualTestPatterns: Array<string> ): Plugin {
	let workspaceRoot = process.cwd();
	let base = '/';
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
	const getManualCatalogBuildInputFilePath = () => resolve( workspaceRoot, 'index.html' );
	const getManualCatalogScriptPublicPath = () => toPublicFilePath( MANUAL_CATALOG_SCRIPT_FILE_PATH, workspaceRoot );
	const getManualShellScriptPublicPath = () => toPublicFilePath( MANUAL_SHELL_SCRIPT_FILE_PATH, workspaceRoot );
	const getManualCatalogClientPath = ( entry: ManualPageEntry ) => toBaseCatalogPath( base, entry.htmlFilePath );
	const getManualBuildInputs = () => [
		getManualCatalogBuildInputFilePath(),
		...[ ...getManualPages().values() ].map( entry => resolve( workspaceRoot, entry.htmlFilePath.slice( 1 ) ) )
	];
	const resolvedVirtualModuleId = `\0${ MANUAL_ENTRIES_VIRTUAL_ID }`;
	const getClientEntries = (): Array<ManualTestClientEntry> => [ ...getManualPages().values() ].map( entry => ( {
		displayName: entry.displayName,
		href: toBasePublicPath( entry.htmlFilePath, base ),
		packageName: entry.packageName,
		slug: entry.slug
	} ) );
	const getManualEntriesJson = () => JSON.stringify( getClientEntries(), null, 2 );

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
			base = config.base || '/';

			invalidateManualFileCaches();

			config.build.rolldownOptions.input = getManualBuildInputs();
		},

		configureServer( server ) {
			const { memoryFiles } = server.environments.client as BundledDevClientEnvironment;

			useManualTestMiddlewares( server, getManualCatalogPublicPath, getManualStaticAssets );
			useBundledDevManualHtmlSource(
				memoryFiles,
				getManualPages,
				getManualShellScriptPublicPath,
				getManualCatalogClientPath,
				() => workspaceRoot
			);
		},

		resolveId( source ) {
			if ( source == MANUAL_ENTRIES_VIRTUAL_ID ) {
				return resolvedVirtualModuleId;
			}

			if ( isManualCatalogBuildInputSpecifier( source, getManualCatalogBuildInputFilePath(), workspaceRoot ) ) {
				return getManualCatalogBuildInputFilePath();
			}

			return null;
		},

		load( id ) {
			if ( id == resolvedVirtualModuleId ) {
				return `export const manualTestEntries = ${ getManualEntriesJson() };`;
			}

			if ( toPosixPath( id ) == toPosixPath( getManualCatalogBuildInputFilePath() ) ) {
				return readFileSync( MANUAL_CATALOG_FILE_PATH, 'utf8' );
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
				if ( isManualCatalogHtmlFile( context.filename, getManualCatalogBuildInputFilePath() ) ) {
					return html.replace( './catalog.ts', getManualCatalogScriptPublicPath() );
				}

				const entry = getManualPageEntryForFile( context.filename );

				if ( !entry ) {
					return undefined;
				}

				return createManualShellHtml( {
					catalogPublicPath: getManualCatalogClientPath( entry ),
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
	getManualCatalogClientPath: ( entry: ManualPageEntry ) => string,
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
			catalogPublicPath: getManualCatalogClientPath( entry ),
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

function isManualCatalogHtmlFile( filePath: string, catalogBuildInputFilePath: string ): boolean {
	const normalizedFilePath = toPosixPath( filePath );

	return normalizedFilePath == toPosixPath( MANUAL_CATALOG_FILE_PATH ) ||
		normalizedFilePath == toPosixPath( catalogBuildInputFilePath );
}

function isManualCatalogBuildInputSpecifier( source: string, catalogBuildInputFilePath: string, workspaceRoot: string ): boolean {
	return toPosixPath( resolve( workspaceRoot, source ) ) == toPosixPath( catalogBuildInputFilePath );
}

function toBasePublicPath( publicPath: string, base: string ): string {
	if ( base == '' || base == './' ) {
		return `.${ publicPath }`;
	}

	return `${ base.replace( /\/$/, '' ) }${ publicPath }`;
}

function toBaseCatalogPath( base: string, entryHtmlFilePath: string ): string {
	if ( base == '' || base == './' ) {
		return posix.relative( posix.dirname( stripLeadingSlash( entryHtmlFilePath ) ), 'index.html' );
	}

	return base;
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

	if ( isExternalScriptSource( source ) ) {
		return false;
	}

	return posix.basename( source ) == testScriptFileName;
}

function isExternalScriptSource( source: string ): boolean {
	return source.startsWith( 'http://' ) || source.startsWith( 'https://' ) || source.startsWith( '//' );
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
