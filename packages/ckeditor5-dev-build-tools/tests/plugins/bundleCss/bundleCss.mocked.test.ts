/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Buffer } from 'node:buffer';
import { beforeEach, expect, test, vi } from 'vitest';
import type { ModuleInfo, NormalizedOutputOptions, OutputBundle, OutputChunk, PartialResolvedId } from 'rolldown';

const bundleAsyncMock = vi.hoisted( () => vi.fn() );

vi.mock( 'lightningcss', () => ( {
	Features: {
		Nesting: 1
	},
	bundleAsync: bundleAsyncMock,
	transform: vi.fn( () => ( {
		code: Buffer.from( '' ),
		warnings: []
	} ) )
} ) );

import { bundleCss } from '../../../src/plugins/bundleCss.js';

function createChunk( name: string, moduleIds: Array<string>, options: Partial<OutputChunk> = {} ): OutputChunk {
	return {
		type: 'chunk',
		fileName: `${ name }.js`,
		name,
		facadeModuleId: `/src/${ name }.ts`,
		isEntry: true,
		isDynamicEntry: false,
		implicitlyLoadedBefore: [],
		importedBindings: {},
		imports: [],
		dynamicImports: [],
		exports: [],
		moduleIds,
		modules: Object.fromEntries( moduleIds.map( id => [ id, {
			code: '',
			originalLength: 0,
			removedExports: [],
			renderedExports: [],
			renderedLength: 0
		} ] ) ),
		code: '',
		map: null,
		preliminaryFileName: `${ name }.js`,
		referencedFiles: [],
		sourcemapFileName: null,
		viteMetadata: undefined,
		...options
	} as unknown as OutputChunk;
}

function createCssBundle(): OutputBundle {
	return {
		'main.js': createChunk( 'main', [ '/styles/index-editor.css' ] )
	};
}

beforeEach( () => {
	bundleAsyncMock.mockResolvedValue( {
		code: Buffer.from( '.ck {}' ),
		warnings: []
	} );
} );

async function runGenerateBundle(
	plugin: ReturnType<typeof bundleCss>,
	context: any,
	outputOptions: NormalizedOutputOptions,
	bundle: OutputBundle
) {
	const generateBundle = typeof plugin.generateBundle == 'function' ? plugin.generateBundle : plugin.generateBundle!.handler;

	await generateBundle.call( context, outputOptions, bundle, false );
}

function createContext( options: {
	moduleInfo?: Record<string, Pick<ModuleInfo, 'importedIds'> & Partial<Pick<ModuleInfo, 'dynamicallyImportedIds'>>>;
	resolve?: ( specifier: string, importer: string ) => Promise<PartialResolvedId | null> | PartialResolvedId | null;
} = {} ) {
	const emittedFiles: Array<any> = [];

	return {
		addWatchFile: vi.fn(),
		emitFile: vi.fn( file => emittedFiles.push( file ) ),
		error: ( message: string ) => {
			throw new Error( message );
		},
		getModuleInfo: ( id: string ) => options.moduleInfo?.[ id ] as ModuleInfo | null,
		resolve: vi.fn( async ( specifier: string, importer: string ) => {
			return options.resolve ? options.resolve( specifier, importer ) : null;
		} ),
		warn: vi.fn(),
		emittedFiles
	};
}

test( 'Orders CSS modules by the JavaScript import order of the entry chunk', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		const virtualEntry = options.resolver.read( '/__cke5_bundle_css__.css' );
		const specifiers = [ ...virtualEntry.matchAll( /"([^"]+)"/g ) ].map( match => match[ 1 ] );

		expect( specifiers ).toEqual( [ '/styles/main/index-editor.css', '/styles/shared/index-editor.css' ] );

		return {
			code: Buffer.from( '.ck {}' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( {
		fileName: 'styles.css',
		sourceMap: true
	} );
	const context = createContext( {
		moduleInfo: {
			'/src/shared.ts': { importedIds: [ '/styles/shared/index-editor.css' ] },
			'/src/main.ts': {
				importedIds: [ '/styles/main/index-editor.css', '/styles/shared/index-editor.css' ]
			}
		}
	} );
	const bundle: OutputBundle = {
		'main.js': createChunk( 'main', [ '/src/shared.ts', '/src/main.ts' ] )
	};

	await runGenerateBundle( plugin, context, {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, bundle );

	expect( context.emittedFiles ).toContainEqual( expect.objectContaining( {
		fileName: 'styles.css',
		type: 'asset'
	} ) );
} );

test( 'Collects CSS imports of modules reachable only through an inlined dynamic import', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		const virtualEntry = options.resolver.read( '/__cke5_bundle_css__.css' );
		const specifiers = [ ...virtualEntry.matchAll( /"([^"]+)"/g ) ].map( match => match[ 1 ] );

		expect( specifiers ).toEqual( [ '/styles/lazy/index-editor.css', '/styles/main/index-editor.css' ] );

		return {
			code: Buffer.from( '.ck {}' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( {
		fileName: 'styles.css',
		sourceMap: true
	} );
	const context = createContext( {
		moduleInfo: {
			'/src/lazy.ts': { importedIds: [ '/styles/lazy/index-editor.css' ] },
			'/src/main.ts': {
				importedIds: [ '/styles/main/index-editor.css' ],

				// The `/src/split.ts` module is not part of the chunk, so it must not become a traversal root.
				dynamicallyImportedIds: [ '/src/lazy.ts', '/src/split.ts' ]
			}
		}
	} );
	const bundle: OutputBundle = {
		'main.js': createChunk( 'main', [ '/src/lazy.ts', '/src/main.ts' ] )
	};

	await runGenerateBundle( plugin, context, {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, bundle );

	expect( context.emittedFiles ).toContainEqual( expect.objectContaining( {
		fileName: 'styles.css',
		type: 'asset'
	} ) );
} );

test( 'Traverses every module of entry and dynamic entry chunks without a facade module and caches shared results', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		const virtualEntry = options.resolver.read( '/__cke5_bundle_css__.css' );
		const specifiers = [ ...virtualEntry.matchAll( /"([^"]+)"/g ) ].map( match => match[ 1 ] );

		expect( specifiers ).toEqual( [ '/styles/shared/index-editor.css', '/styles/second/index-editor.css' ] );

		return {
			code: Buffer.from( '.ck {}' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( {
		fileName: 'styles.css',
		sourceMap: true
	} );
	const context = createContext( {
		moduleInfo: {
			'/src/shared.ts': { importedIds: [ '/styles/shared/index-editor.css' ] },
			'/src/second.ts': { importedIds: [ '/styles/second/index-editor.css' ] }
		}
	} );
	const bundle: OutputBundle = {
		'first.js': createChunk( 'first', [ '/src/shared.ts' ], { facadeModuleId: null } ),

		// The `/src/no-module-info.ts` module has no module info registered, so it ends the traversal.
		'second.js': createChunk( 'second', [ '/src/shared.ts', '/src/second.ts', '/src/no-module-info.ts' ], {
			facadeModuleId: null,
			isEntry: false,
			isDynamicEntry: true
		} )
	};

	await runGenerateBundle( plugin, context, {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, bundle );

	expect( context.emittedFiles ).toContainEqual( expect.objectContaining( {
		fileName: 'styles.css',
		type: 'asset'
	} ) );
} );

test( 'Throws when Rolldown resolves a CSS import as external', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		await expect( options.resolver.resolve( './external.css', '/src/source.css' ) )
			.rejects.toThrow( 'External CSS imports are not supported. Found ./external.css in /src/source.css.' );

		return {
			code: Buffer.from( '' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( {
		fileName: 'styles.css',
		sourceMap: true
	} );
	const context = createContext( {
		resolve: () => ( {
			id: '/styles/external.css',
			external: true
		} )
	} );

	await runGenerateBundle( plugin, context, {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, createCssBundle() );
} );

test( 'Uses the current working directory as the project root when output location is not specified', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		expect( options.projectRoot ).toBe( process.cwd() );

		return {
			code: Buffer.from( '' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( {
		fileName: 'styles.css',
		sourceMap: true
	} );

	await runGenerateBundle( plugin, createContext(), {
		preserveModules: false
	} as NormalizedOutputOptions, createCssBundle() );
} );

test( 'Throws when a CSS import cannot be resolved by Rolldown', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		await expect( options.resolver.resolve( 'package/theme.css', '/src/source.css' ) )
			.rejects.toThrow( 'Unable to resolve CSS import package/theme.css in /src/source.css.' );
		await expect( options.resolver.resolve( './missing/local.css', '/src/source.css' ) )
			.rejects.toThrow( 'Unable to resolve CSS import ./missing/local.css in /src/source.css.' );

		return {
			code: Buffer.from( '' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( {
		fileName: 'styles.css',
		sourceMap: true
	} );

	await runGenerateBundle( plugin, createContext(), {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, createCssBundle() );
} );

test( 'Emits warnings for virtual entry diagnostics without a warning type', async () => {
	bundleAsyncMock.mockImplementationOnce( async () => ( {
		code: Buffer.from( '' ),
		warnings: [ {
			loc: {
				filename: '/__cke5_bundle_css__.css',
				line: 3,
				column: 4
			},
			message: 'Virtual entry warning'
		} ]
	} ) );

	const plugin = bundleCss( {
		fileName: 'styles.css',
		sourceMap: true
	} );
	const context = createContext();

	await runGenerateBundle( plugin, context, {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, createCssBundle() );

	expect( context.warn ).toHaveBeenCalledWith(
		'Lightning CSS warning in styles.css:3:5: Virtual entry warning'
	);
} );
