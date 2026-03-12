/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Buffer } from 'node:buffer';
import { expect, test, vi } from 'vitest';
import type { ModuleInfo, NormalizedOutputOptions, OutputBundle, OutputChunk, PartialResolvedId } from 'rollup';

const bundleAsyncMock = vi.hoisted( () => vi.fn() );

vi.mock( 'lightningcss', () => ( {
	Features: {
		Nesting: 1
	},
	bundleAsync: bundleAsyncMock
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
	moduleInfo?: Record<string, Pick<ModuleInfo, 'importedIds'>>;
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

test( 'Processes CSS collected from manual chunks before entry chunks', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		const virtualEntry = options.resolver.read( '/__cke5_bundle_css__.css' );
		const specifiers = [ ...virtualEntry.matchAll( /"([^"]+)"/g ) ].map( match => match[ 1 ] );
		const resolvedImports = await Promise.all(
			specifiers.map( specifier => options.resolver.resolve( specifier, '/__cke5_bundle_css__.css' ) )
		);

		expect( resolvedImports ).toEqual( [ '/styles/shared.css', '/styles/main.css' ] );

		return {
			code: Buffer.from( '.ck {}' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( { fileName: 'styles.css' } );
	const context = createContext( {
		moduleInfo: {
			'/src/shared.ts': { importedIds: [ '/styles/shared.css' ] },
			'/src/main.ts': { importedIds: [ '/styles/main.css', '/styles/shared.css' ] }
		}
	} );
	const bundle: OutputBundle = {
		'shared.js': createChunk( 'shared', [ '/src/shared.ts' ], {
			facadeModuleId: null,
			isEntry: false
		} ),
		'main.js': createChunk( 'main', [ '/src/main.ts' ] )
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

test( 'Throws when a generated virtual stylesheet import cannot be resolved', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		await expect( options.resolver.resolve( '__missing__', '/__cke5_bundle_css__.css' ) )
			.rejects.toThrow( 'Cannot resolve generated stylesheet entry import: __missing__.' );

		return {
			code: Buffer.from( '' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( { fileName: 'styles.css' } );

	await runGenerateBundle( plugin, createContext(), {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, {} );
} );

test( 'Throws when Rollup resolves a CSS import as external', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		await expect( options.resolver.resolve( './external.css', '/src/source.css' ) )
			.rejects.toThrow( 'External CSS imports are not supported. Found ./external.css in /src/source.css.' );

		return {
			code: Buffer.from( '' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( { fileName: 'styles.css' } );
	const context = createContext( {
		resolve: () => ( {
			id: '/styles/external.css',
			external: true
		} )
	} );

	await runGenerateBundle( plugin, context, {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, {} );
} );

test( 'Resolves absolute and relative CSS imports without Rollup results', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		expect( await options.resolver.resolve( '/styles/absolute.css', '/src/components/source.css' ) )
			.toBe( '/styles/absolute.css' );
		expect( await options.resolver.resolve( './nested/local.css', '/src/components/source.css?inline' ) )
			.toBe( '/src/components/nested/local.css' );

		return {
			code: Buffer.from( '' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( { fileName: 'styles.css' } );

	await runGenerateBundle( plugin, createContext(), {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, {} );
} );

test( 'Throws when a non-relative CSS import cannot be resolved', async () => {
	bundleAsyncMock.mockImplementationOnce( async options => {
		await expect( options.resolver.resolve( 'package/theme.css', '/src/source.css' ) )
			.rejects.toThrow( 'Unable to resolve CSS import package/theme.css in /src/source.css.' );

		return {
			code: Buffer.from( '' ),
			warnings: []
		};
	} );

	const plugin = bundleCss( { fileName: 'styles.css' } );

	await runGenerateBundle( plugin, createContext(), {
		file: '/dist/main.js',
		preserveModules: false
	} as NormalizedOutputOptions, {} );
} );
