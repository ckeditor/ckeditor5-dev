/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { existsSync, readFileSync, realpathSync } from 'node:fs';
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
const MANUAL_TEST_SUFFIX = '.manual.html';
const MANUAL_TESTS_DIRECTORY = '/tests/manual/';
const THEME_ENTRY_FILE_PATH = 'theme/index.css';
const HEAD_CLOSE_TAG = '</head>';
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
	const getManualPageEntryForScriptSpecifier = ( scriptSpecifier: string ): ManualPageEntry | undefined => {
		const htmlSpecifier = scriptSpecifier.replace( /\.(?:js|ts)$/, MANUAL_TEST_SUFFIX );

		return htmlSpecifier == scriptSpecifier ? undefined : getManualPages().get( htmlSpecifier );
	};
	const packageThemeEntryCache = new Map<string, boolean>();
	const hasPackageThemeEntry = ( packageRootSpecifier: string ): boolean => {
		if ( !packageThemeEntryCache.has( packageRootSpecifier ) ) {
			const themeEntryFilePath = resolve( workspaceRoot, stripLeadingSlash( packageRootSpecifier ), THEME_ENTRY_FILE_PATH );

			packageThemeEntryCache.set( packageRootSpecifier, existsSync( themeEntryFilePath ) );
		}

		return packageThemeEntryCache.get( packageRootSpecifier )!;
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
			packageThemeEntryCache.clear();

			config.build.rolldownOptions.input = getManualBuildInputs();
		},

		configureServer( server ) {
			server.middlewares.use( ( request: { url?: string }, _response: unknown, next: () => void ) => {
				rewriteCatalogRequest( request, getManualCatalogPublicPath() );

				next();
			} );

			const clientEnvironment = server.environments.client as typeof server.environments.client & BundledDevClientEnvironment;

			keepManualHtmlSourceFresh( clientEnvironment.bundledDev?.memoryFiles, getManualPages, workspaceRoot );
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

		transform: {
			order: 'pre',

			// Loads the package theme entry stylesheet (`theme/index.css`) in manual tests.
			// Package stylesheets are imported by the package entry module (`src/index.ts`), not by
			// individual source modules, and manual tests import source modules directly - without
			// this they would render without the package's own styles. Stylesheets of other packages
			// still arrive transitively through their package entry imports. Only the entry script of
			// a discovered manual page is transformed; helper modules receive the styles through the
			// entry that imports them. The import is appended after the module code: import
			// declarations evaluate in source order, so the package styles load after the dependency
			// styles pulled by the module's own imports, matching the cascade of the built bundles
			// (where the package entry imports its stylesheet last). Appending also keeps the
			// original line numbers, so no source map is needed.
			handler( code, id ) {
				const scriptSpecifier = toPublicSpecifier( relative( workspaceRoot, id.split( '?' )[ 0 ]! ) );
				const entry = getManualPageEntryForScriptSpecifier( scriptSpecifier );

				if ( !entry ) {
					return;
				}

				const packageRootSpecifier = entry.htmlFilePath.slice( 0, entry.htmlFilePath.indexOf( MANUAL_TESTS_DIRECTORY ) );

				if ( !hasPackageThemeEntry( packageRootSpecifier ) ) {
					return;
				}

				const themeEntrySpecifier = posix.relative(
					posix.dirname( scriptSpecifier ),
					`${ packageRootSpecifier }/${ THEME_ENTRY_FILE_PATH }`
				);

				return {
					code: `${ code }\nimport '${ themeEntrySpecifier }';\n`,
					map: null
				};
			}
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
				// refresh prompt). It is prepended to `<head>` so it executes before the test's own
				// module script: the bootstrap must set the global license key and install the
				// `window.editor` inspector setter first. The header chrome is opt-in via
				// `<ck-manual-header>` in the source.
				const tags: Array<HtmlTagDescriptor> = [
					createModuleScriptTag( getManualBootstrapScriptPublicPath(), 'head-prepend' )
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

interface ManualMemoryFile {
	source: string | Uint8Array;
}

interface ManualMemoryFiles {
	get( filePath: string ): ManualMemoryFile | undefined;
}

interface BundledDevClientEnvironment {
	bundledDev?: {
		memoryFiles?: ManualMemoryFiles;
	};
}

/**
 * Keeps the served manual test HTML in sync with the source file while the dev server runs.
 *
 * Under `experimental.bundledDev`, Vite serves each manual test's HTML from an in-memory bundle
 * produced by the rolldown dev engine. That engine emits the HTML output only during the initial
 * build and never regenerates it when the source `.html` changes: its bundle state reports no
 * stale output for HTML entries, `devEngine.invalidate()` throws on a non-JS module, and even a
 * forced full build leaves the HTML memory file untouched (verified against Vite 8.1.0). A `.html`
 * edit still triggers a full page reload, so without this the browser reloads into the same stale
 * HTML until the server is restarted.
 *
 * The built-in-memory HTML rewrites the entry script, injects the asset tags and manual chrome,
 * and copies the source `<head>` — all inside `<head>`. The markup after `</head>` is a verbatim
 * copy of the source. So on every request we keep the freshly built `<head>` and splice in the
 * current post-`</head>` markup read from disk. Splicing unconditionally (rather than only after a
 * detected change) also covers sources that changed between the initial build and the first request
 * for the page, and it is idempotent for unchanged sources. This reflects edits to the test body
 * without re-running Vite's HTML transform or parsing the document. Any edit that would change
 * what belongs in `<head>` is not picked up this way and still needs a server restart, because
 * reproducing it would require re-running the build pipeline the dev engine refuses to run for HTML
 * entries. That covers edits confined to the `<head>` (styles, meta, extra scripts) as well as
 * adding or removing `<ck-manual-header>` in the body: toggling it changes the injected header
 * chrome (`<meta>` and the component script) in `<head>`, so the chrome only updates after a
 * restart even though the body splice already reflects the element itself.
 *
 * When `bundledDev` is not enabled the store is absent and this is a no-op: Vite's normal dev
 * pipeline already serves fresh HTML on every request.
 */
function keepManualHtmlSourceFresh(
	memoryFiles: ManualMemoryFiles | undefined,
	getManualPages: () => Map<string, ManualPageEntry>,
	workspaceRoot: string
): void {
	if ( !memoryFiles ) {
		return;
	}

	const getBundledFile = memoryFiles.get.bind( memoryFiles );

	memoryFiles.get = ( filePath: string ) => {
		const file = getBundledFile( filePath );

		// Only discovered `.manual.html` entries are refreshed; asset memory files pass through.
		if ( !file || !getManualPages().has( toPublicSpecifier( filePath ) ) ) {
			return file;
		}

		try {
			const sourceFilePath = resolve( workspaceRoot, stripLeadingSlash( filePath ) );

			// HTML entry outputs are always emitted as strings.
			const freshHtml = composeFreshManualHtml( file.source as string, readFileSync( sourceFilePath, 'utf8' ) );

			return freshHtml == null ? file : { source: freshHtml };
		} catch {
			// Reading or splicing the source must never break serving the page; fall back to the
			// built memory file if anything goes wrong (e.g. the file was removed by a branch switch).
			return file;
		}
	};
}

/**
 * Combines the freshly built `<head>` (asset tags and injected manual chrome) with the current
 * post-`</head>` markup from the source file. Returns `null` when either document is missing a
 * `</head>`, so the caller can fall back to the built output.
 */
function composeFreshManualHtml( builtHtml: string, sourceHtml: string ): string | null {
	const builtHeadEnd = findHeadCloseTagIndex( builtHtml );
	const sourceHeadEnd = findHeadCloseTagIndex( sourceHtml );

	if ( builtHeadEnd == -1 || sourceHeadEnd == -1 ) {
		return null;
	}

	return builtHtml.slice( 0, builtHeadEnd + HEAD_CLOSE_TAG.length ) + sourceHtml.slice( sourceHeadEnd + HEAD_CLOSE_TAG.length );
}

/**
 * Finds the index of the `</head>` closing tag, or `-1` when the document has none. A `</head>`
 * literal may also appear earlier inside a `<head>` comment or an inline script string, so of all
 * the occurrences preceding the `<body>` tag the last one is taken. Without a `<body>` tag (or
 * when every occurrence follows it) the first occurrence wins, matching the pre-heuristic
 * behavior for such malformed documents.
 */
function findHeadCloseTagIndex( html: string ): number {
	const firstHeadCloseIndex = /<\/head>/i.exec( html )?.index ?? -1;
	const bodyMatch = /<body[\s>]/i.exec( html );

	if ( !bodyMatch ) {
		return firstHeadCloseIndex;
	}

	const headClosePattern = /<\/head>/gi;
	let lastHeadCloseIndex = -1;
	let match;

	while ( ( match = headClosePattern.exec( html ) ) && match.index < bodyMatch.index ) {
		lastHeadCloseIndex = match.index;
	}

	return lastHeadCloseIndex == -1 ? firstHeadCloseIndex : lastHeadCloseIndex;
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

function createModuleScriptTag( src: string, injectTo: 'head' | 'head-prepend' = 'head' ): HtmlTagDescriptor {
	return {
		tag: 'script',
		attrs: {
			type: 'module',
			src
		},
		injectTo
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
