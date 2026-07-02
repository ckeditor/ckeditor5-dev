/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { posix, resolve, relative } from 'node:path';
import { collectManualPages } from './collect-pages.js';
import { cacheValue, createPackageNameFilter, stripLeadingSlash, toPosixPath, toPublicFilePath, toPublicSpecifier } from '../utils.js';
import type { Plugin, HtmlTagDescriptor } from 'vite';
import type { ManualPageEntry } from './types.js';

interface ManualTestClientEntry {
	href: string;
	packageName: string;
	slug: string;
}

export interface ManualTestsPluginOptions {
	paths: Array<string>;
	include?: Array<string>;
}

// The custom element that opts a page into the test chrome. The component script and its data
// are injected only when the page source contains this marker.
const MANUAL_HEADER_ELEMENT = 'ck-manual-header';
const MANUAL_ENTRIES_VIRTUAL_ID = 'virtual:ckeditor5-manual-entries';
const MANUAL_THEME_ROOT = realpathSync( fileURLToPath( import.meta.resolve( '@ckeditor/ckeditor5-dev-manual-server/theme' ) ) );
const MANUAL_CATALOG_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'catalog.html' );
const MANUAL_CATALOG_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'catalog.ts' );
const MANUAL_BOOTSTRAP_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'manual-bootstrap.ts' );
const MANUAL_HEADER_SCRIPT_FILE_PATH = resolve( MANUAL_THEME_ROOT, 'manual-header.ts' );

export function manualTestsPlugin( options: ManualTestsPluginOptions ): Plugin {
	let workspaceRoot = process.cwd();
	let base = '/';
	const includePackageNames = ( options.include || [] ).filter( Boolean );
	const manualPagesCache = cacheValue( () => filterManualPages(
		collectManualPages( options.paths, workspaceRoot ),
		includePackageNames
	) );
	const getManualPages = manualPagesCache.get;
	const getManualPageEntryForFile = ( filePath: string ): ManualPageEntry | undefined => {
		return getManualPages().get( toPublicSpecifier( relative( workspaceRoot, filePath ) ) );
	};
	const getManualCatalogBuildInputFilePath = () => resolve( workspaceRoot, 'index.html' );
	const getManualCatalogPublicPath = () => toPublicFilePath( getManualCatalogBuildInputFilePath(), workspaceRoot );
	const getManualCatalogScriptPublicPath = () => toPublicFilePath( MANUAL_CATALOG_SCRIPT_FILE_PATH, workspaceRoot );
	const getManualBootstrapScriptPublicPath = () => toPublicFilePath( MANUAL_BOOTSTRAP_SCRIPT_FILE_PATH, workspaceRoot );
	const getManualHeaderScriptPublicPath = () => toPublicFilePath( MANUAL_HEADER_SCRIPT_FILE_PATH, workspaceRoot );
	const getManualBuildInputs = () => [
		getManualCatalogBuildInputFilePath(),
		...[ ...getManualPages().values() ].map( entry => resolve( workspaceRoot, stripLeadingSlash( entry.htmlFilePath ) ) )
	];
	const resolvedVirtualModuleId = `\0${ MANUAL_ENTRIES_VIRTUAL_ID }`;
	const getClientEntries = (): Array<ManualTestClientEntry> => [ ...getManualPages().values() ].map( entry => ( {
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

			manualPagesCache.invalidate();

			config.build.rolldownOptions.input = getManualBuildInputs();
		},

		configureServer( server ) {
			server.middlewares.use( ( request: { url?: string }, _response: unknown, next: () => void ) => {
				rewriteCatalogRequest( request, getManualCatalogPublicPath() );

				next();
			} );
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

		transformIndexHtml: {
			order: 'pre',

			handler( html, context ) {
				if ( isManualCatalogHtmlFile( context.filename, getManualCatalogBuildInputFilePath() ) ) {
					return html.replace( './catalog.ts', getManualCatalogScriptPublicPath() );
				}

				const entry = getManualPageEntryForFile( context.filename );

				// Only discovered `.manual.html` entries are touched; plain `.html` fixtures get nothing.
				if ( !entry ) {
					return undefined;
				}

				// Every manual test gets the invisible environment bootstrap (license key, inspector,
				// refresh prompt). The header chrome is opt-in via `<ck-manual-header>` in the source.
				const tags: Array<HtmlTagDescriptor> = [
					createModuleScriptTag( getManualBootstrapScriptPublicPath() )
				];

				if ( html.includes( `<${ MANUAL_HEADER_ELEMENT }` ) ) {
					tags.push( ...createManualHeaderTags(
						entry,
						getManualHeaderScriptPublicPath(),
						toBaseCatalogPath( base, entry.htmlFilePath )
					) );
				}

				return { html, tags };
			}
		}
	};
}

/**
 * Injection contract for the `<ck-manual-header>` component, added to `<head>` only when the
 * page source contains the element:
 * - a `<meta>` carrying the package name and the base-aware catalog href the component reads;
 * - the module `<script>` that defines the custom element (folded into the page bundle under
 *   `bundledDev`, which is fine — it still executes).
 */
function createManualHeaderTags(
	entry: ManualPageEntry,
	headerScriptPublicPath: string,
	catalogHref: string
): Array<HtmlTagDescriptor> {
	return [
		{
			tag: 'meta',
			attrs: {
				'name': MANUAL_HEADER_ELEMENT,
				'data-package-name': entry.packageName,
				'data-catalog-href': catalogHref
			},
			injectTo: 'head'
		},
		createModuleScriptTag( headerScriptPublicPath )
	];
}

function createModuleScriptTag( src: string ): HtmlTagDescriptor {
	return {
		tag: 'script',
		attrs: {
			type: 'module',
			src
		},
		injectTo: 'head'
	};
}

function filterManualPages(
	manualPages: Map<string, ManualPageEntry>,
	includePackageNames: Array<string>
): Map<string, ManualPageEntry> {
	const isIncluded = createPackageNameFilter( includePackageNames );

	return new Map( [ ...manualPages ].filter( ( [ , entry ] ) => isIncluded( entry.packageName ) ) );
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
