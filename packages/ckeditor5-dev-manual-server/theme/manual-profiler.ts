/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Context, Editor, PluginCollection } from '@ckeditor/ckeditor5-core';

/**
 * Startup profiler for manual tests, installed by `manual-bootstrap.ts` on every manual test page, so
 * that every editor created on the page is profiled with no per-test code.
 *
 * Everything below the divider further down is the profiler from
 * ckeditor/ckeditor5-commercial#9912, copied verbatim - do not refactor it there. Above the divider is
 * the integration, which replaces the original's opt-in `ProfilerMixin( EditorClass )` with three
 * prototype patches.
 */

// Per collection, so that several editors on one page never mix up their timings.
const PLUGIN_RECORDS = Symbol( 'ckeditor5-manual-profiler-records' );

// Stamped in the `Context#_addEditor()` hook, read back in `initPlugins()`.
const CREATE_START_TIME = Symbol( 'ckeditor5-manual-profiler-create-start' );

let isProfilerInstalled = false;

// The record shape the verbatim profiler builds and reads back; typed here only for the integration.
interface ProfilerRecord {
	name: string;
	requires: any;
	initStart: any;
	initEnd: any;
	afterInitStart: any;
	afterInitEnd: any;
}

interface PluginCollectionLike {
	_add( PluginConstructor: unknown, plugin: unknown ): unknown;
	[ PLUGIN_RECORDS ]?: Map<string, ProfilerRecord>;
}

interface EditorLike {
	initPlugins(): Promise<unknown>;
	once( event: string, callback: () => void ): void;
	plugins: PluginCollectionLike;
	data?: { init?: unknown };
	ui?: { init?: unknown };
	[ CREATE_START_TIME ]?: number;
}

interface ContextLike {
	_addEditor( editor: EditorLike, isContextOwner: boolean ): unknown;
}

/**
 * Installs the hooks. Only the first call patches anything.
 */
export function setUpStartupProfiler(): void {
	if ( isProfilerInstalled ) {
		return;
	}

	isProfilerInstalled = true;

	instrumentContext();
	instrumentPluginCollection();
	instrumentEditor();
}

/**
 * Stamps the start of `Editor.create()`. The base `Editor` constructor calls this with the editor being
 * constructed, which is the earliest point reachable without knowing the concrete editor class - every
 * editor type declares its own static `create()`, and `Editor.create()` itself only throws.
 */
function instrumentContext(): void {
	const contextPrototype = Context.prototype as unknown as ContextLike;
	const originalAddEditor = contextPrototype._addEditor;

	if ( typeof originalAddEditor != 'function' ) {
		reportBrokenHook( 'Context#_addEditor() is gone - the total time excludes the editor constructor.' );

		return;
	}

	contextPrototype._addEditor = function( editor, isContextOwner ) {
		editor[ CREATE_START_TIME ] ??= performance.now();

		return originalAddEditor.call( this, editor, isContextOwner );
	};
}

/**
 * Records per-plugin timings. `_add()` is private, but there is no public alternative:
 * `PluginCollection#init()` binds the `init`/`afterInit` methods of all plugins in one synchronous pass
 * right after instantiating them, so no public hook fires in between.
 */
function instrumentPluginCollection(): void {
	const collectionPrototype = PluginCollection.prototype as unknown as PluginCollectionLike;
	const originalAdd = collectionPrototype._add;

	if ( typeof originalAdd != 'function' ) {
		reportBrokenHook( 'PluginCollection#_add() is gone - per-plugin timings are unavailable.' );

		return;
	}

	collectionPrototype._add = function( PluginConstructor, plugin ) {
		patchPluginInstance( plugin, getPluginRecords( this ) );

		return originalAdd.call( this, PluginConstructor, plugin );
	};
}

/**
 * Times the phases that run after `initPlugins()` and reports on `ready`.
 */
function instrumentEditor(): void {
	const editorPrototype = Editor.prototype as unknown as EditorLike;
	const originalInitPlugins = editorPrototype.initPlugins;

	if ( typeof originalInitPlugins != 'function' ) {
		reportBrokenHook( 'Editor#initPlugins() is gone - the startup profile is unavailable.' );

		return;
	}

	editorPrototype.initPlugins = function( this: EditorLike ) {
		// Falls back to this point when the `_addEditor()` hook could not be installed.
		const startTime = this[ CREATE_START_TIME ] ?? performance.now();
		const coreMetrics = { totalCreate: 0, dataInit: 0, uiInit: 0, pluginsTotal: 0 };
		const records = getPluginRecords( this.plugins );

		if ( typeof this.data?.init == 'function' ) {
			patchTimed( this.data, 'init', ( ms: number ) => ( coreMetrics.dataInit = ms ) );
		}

		// Headless editors and contexts have no UI controller.
		if ( typeof this.ui?.init == 'function' ) {
			patchTimed( this.ui, 'init', ( ms: number ) => ( coreMetrics.uiInit = ms ) );
		}

		this.once( 'ready', () => {
			coreMetrics.totalCreate = performance.now() - startTime;

			// `ready` fires from inside `create()`, and printing costs tens of milliseconds with devtools
			// attached, so reporting synchronously would inflate the duration being measured. The original
			// reported from a wrapper around `create()`, that is, after it had settled.
			setTimeout( () => new ProfilerReport( records, coreMetrics ).print() );
		} );

		return originalInitPlugins.call( this );
	};
}

function getPluginRecords( collection: PluginCollectionLike ): Map<string, ProfilerRecord> {
	collection[ PLUGIN_RECORDS ] ||= new Map();

	return collection[ PLUGIN_RECORDS ];
}

function reportBrokenHook( message: string ): void {
	console.error( `[ckeditor5-manual-profiler] The editor internals this profiler hooks into changed: ${ message }` );
}

/* -------------------------------------------------------------------------------------------------- *
 * Verbatim from ckeditor/ckeditor5-commercial#9912. Function bodies are unchanged; `ProfilerMixin()`
 * and `patchPluginCollection()` are dropped (replaced by the hooks above), parameters are typed `any`
 * and class fields are declared, because TypeScript requires it.
 * -------------------------------------------------------------------------------------------------- */

/**
 * Replaces `obj[key]` with a timing wrapper that calls `onDone(ms)` after the
 * original resolves. Handles both synchronous and async originals.
 */
function patchTimed( obj: any, key: any, onDone: any ): void {
	const orig = obj[ key ];
	obj[ key ] = function( this: any, ...args: Array<any> ) {
		const start = performance.now();
		const result = orig.apply( this, args );
		if ( result instanceof Promise ) {
			return result.then( res => {
				onDone( performance.now() - start );
				return res;
			} );
		}
		onDone( performance.now() - start );
		return result;
	};
}

/**
 * Instruments a single plugin instance: records its `init` and `afterInit` timings
 * in `records`. No-ops if the plugin was already registered.
 */
function patchPluginInstance( instance: any, records: any ): void {
	const PluginClass = instance.constructor;
	const name = PluginClass.pluginName ?? PluginClass.name ?? 'unknown';

	if ( records.has( name ) ) {
		return;
	}

	const record = {
		name,
		requires: PluginClass.requires ?? [],
		initStart: null, initEnd: null,
		afterInitStart: null, afterInitEnd: null
	};
	records.set( name, record );

	const origInit = instance.init?.bind( instance );
	const origAfterInit = instance.afterInit?.bind( instance );

	if ( origInit ) {
		instance.init = async () => {
			record.initStart = performance.now();
			const result = await origInit();
			record.initEnd = performance.now();
			return result;
		};
	} else {
		record.initStart = record.initEnd = 0;
	}

	if ( origAfterInit ) {
		instance.afterInit = async () => {
			record.afterInitStart = performance.now();
			const result = await origAfterInit();
			record.afterInitEnd = performance.now();
			return result;
		};
	} else {
		record.afterInitStart = record.afterInitEnd = 0;
	}
}

/**
 * Recursively builds a report node for a single plugin record.
 * Guards against circular dependencies via the `visited` set.
 */
function toNode( r: any, byName: any, depth = 0, visited: any = new Set() ): any {
	if ( visited.has( r.name ) ) {
		return { name: r.name, isCircular: true, totalMs: 0, branchTotalMs: 0, children: [] };
	}

	const seen = new Set( visited );
	seen.add( r.name );

	const initMs = r.initEnd ? r.initEnd - r.initStart : 0;
	const afterMs = r.afterInitEnd ? r.afterInitEnd - r.afterInitStart : 0;
	const totalMs = initMs + afterMs;

	const children = ( r.requires ?? [] )
		.map( ( dep: any ) => byName.get( dep.pluginName ?? dep.name ) )
		.filter( Boolean )
		.map( ( dep: any ) => toNode( dep, byName, depth + 1, seen ) );

	const branchTotalMs = totalMs + children.reduce( ( sum: any, c: any ) => sum + c.branchTotalMs, 0 );

	children.sort( ( a: any, b: any ) => b.branchTotalMs - a.branchTotalMs );

	return { name: r.name, depth, initMs, afterMs, totalMs, branchTotalMs, children };
}

/**
 * Builds a sorted dependency tree from the timing registry.
 * Root nodes are plugins that are not a dependency of any other plugin.
 */
function buildTree( records: any ): any {
	const recordsArr = [ ...records.values() ];
	const byName = new Map( recordsArr.map( ( r: any ) => [ r.name, r ] ) );

	const allDeps = new Set(
		recordsArr.flatMap( ( r: any ) => ( r.requires ?? [] ).map( ( d: any ) => d.pluginName ?? d.name ) )
	);

	return recordsArr
		.filter( ( r: any ) => !allDeps.has( r.name ) )
		.map( ( r: any ) => toNode( r, byName ) )
		.sort( ( a: any, b: any ) => b.branchTotalMs - a.branchTotalMs );
}

/**
 * Formats and prints a profiling report to the browser console.
 * Constructed with the raw timing data collected during editor initialization,
 * then call `print()` to output the full breakdown.
 */
class ProfilerReport {
	private _records: any;
	private _coreMetrics: any;

	constructor( records: any, coreMetrics: any ) {
		this._records = records;
		this._coreMetrics = coreMetrics;
	}

	public print(): void {
		const recordsArr: Array<any> = [ ...this._records.values() ];

		this._coreMetrics.pluginsTotal = recordsArr.reduce(
			( s, r ) => s + ( ( r.initEnd - r.initStart ) || 0 ) + ( ( r.afterInitEnd - r.afterInitStart ) || 0 ),
			0
		);

		console.group( `⚡ CKEditor 5 Profiler — Total time: ${ this._coreMetrics.totalCreate.toFixed( 1 ) }ms` );
		this._printPhases();
		this._printTopSlowest( recordsArr );
		this._printDependencyTree();
		console.groupEnd();
	}

	private _printPhases(): void {
		const { totalCreate, pluginsTotal, dataInit, uiInit } = this._coreMetrics;
		const overhead = Math.max( 0, totalCreate - pluginsTotal - dataInit - uiInit );

		const phases = [
			{ name: '🔌 Plugins (Total)', ms: pluginsTotal },
			{ name: '📝 Data Upcast (HTML -> Model)', ms: dataInit },
			{ name: '🎨 UI Rendering', ms: uiInit },
			{ name: '⚙️ Other overhead (Core/Events/DOM)', ms: overhead }
		].sort( ( a, b ) => b.ms - a.ms );

		console.log( '📊 Main phases breakdown:' );
		for ( const p of phases ) {
			const style = p.ms > 100 ? 'color: red; font-weight: bold;' : '';
			console.log( `%c  ${ p.name.padEnd( 40 ) } ${ p.ms.toFixed( 1 ) }ms`, style );
		}
	}

	private _printTopSlowest( recordsArr: any ): void {
		const ranked = recordsArr
			.map( ( r: any ) => ( {
				name: r.name,
				ms: ( r.initEnd ? r.initEnd - r.initStart : 0 ) +
					( r.afterInitEnd ? r.afterInitEnd - r.afterInitStart : 0 )
			} ) )
			.sort( ( a: any, b: any ) => b.ms - a.ms );

		console.log( '\n🏆 TOP 20 Slowest plugins:' );
		ranked.slice( 0, 20 ).forEach( ( p: any, i: any ) => {
			const style = p.ms > 10 ? 'color: red; font-weight: bold;' : '';
			const num = String( i + 1 ).padStart( 2 ) + '.';
			console.log( `%c  ${ num } ${ p.name.padEnd( 30 ) } ${ p.ms.toFixed( 1 ) }ms`, style );
		} );
	}

	private _printDependencyTree(): void {
		const printedNodes = new Set();
		const tree = buildTree( this._records );
		console.groupCollapsed( '🌳 Dependency Tree' );
		tree.forEach( ( root: any, i: any ) => {
			this._printNode( root, i === tree.length - 1 ? '└── ' : '├── ', printedNodes );
		} );
		console.groupEnd();
	}

	private _printNode( n: any, prefix: any, printedNodes: any ): void {
		if ( n.isCircular || printedNodes.has( n.name ) ) {
			console.log( `${ prefix }${ n.name } (dependencies skipped)` );
			return;
		}

		printedNodes.add( n.name );

		const style = n.totalMs > 10 ? 'color: red; font-weight: bold;' : '';
		const timing =
			`[init: ${ n.initMs.toFixed( 1 ) }ms` +
			` | after: ${ n.afterMs.toFixed( 1 ) }ms` +
			` | total: ${ n.totalMs.toFixed( 1 ) }ms]`;

		console.log( `%c${ prefix }${ n.name } ${ timing }`, style );

		n.children.forEach( ( child: any, i: any ) => {
			const isLast = i === n.children.length - 1;
			const childPrefix = prefix.replace( /├── |└── /g, ( m: any ) => m === '├── ' ? '│   ' : '    ' );
			this._printNode( child, childPrefix + ( isLast ? '└── ' : '├── ' ), printedNodes );
		} );
	}
}
