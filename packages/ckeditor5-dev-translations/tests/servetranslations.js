/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import fs from 'node:fs';
import { rimraf } from 'rimraf';
import webpackSources from 'webpack-sources';
import serveTranslations from '../lib/servetranslations.js';

vi.mock( 'node:fs', () => ( {
	default: {
		existsSync: vi.fn(),
		readFileSync: vi.fn()
	}
} ) );

vi.mock( 'rimraf', () => ( {
	rimraf: {
		sync: vi.fn()
	}
} ) );

const { RawSource, ConcatSource } = webpackSources;

describe( 'serveTranslations()', () => {
	let cwdSpy;

	beforeEach( () => {
		cwdSpy = vi.spyOn( process, 'cwd' ).mockReturnValue( '/project' );
		vi.mocked( fs.existsSync ).mockReturnValue( false );
		vi.mocked( fs.readFileSync ).mockReset();
		vi.mocked( rimraf.sync ).mockReset();
	} );

	afterEach( () => {
		cwdSpy.mockRestore();
	} );

	it( 'should remove old files safely and deduplicate warnings and errors', () => {
		const consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
		const consoleErrorSpy = vi.spyOn( console, 'error' ).mockImplementation( () => {} );
		const translationService = createTranslationService();
		const compiler = createCompiler( { outputPath: '/project/dist' } );
		const options = createOptions( { verbose: true } );

		vi.mocked( fs.existsSync ).mockImplementation( filePath => filePath === path.join( '/project/dist', 'lang' ) );

		serveTranslations( compiler, options, translationService );

		expect( rimraf.sync ).toHaveBeenCalledOnce();
		expect( rimraf.sync ).toHaveBeenCalledWith( path.join( '/project/dist', 'lang' ) );

		translationService.emit( 'warning', 'Duplicated warning' );
		translationService.emit( 'warning', 'Duplicated warning' );
		translationService.emit( 'error', 'Duplicated error' );
		translationService.emit( 'error', 'Duplicated error' );

		expect( consoleWarnSpy ).toHaveBeenCalledOnce();
		expect( consoleWarnSpy.mock.calls[ 0 ][ 0 ] ).toContain( 'Duplicated warning' );

		expect( consoleErrorSpy ).toHaveBeenCalledOnce();
		expect( consoleErrorSpy.mock.calls[ 0 ][ 0 ] ).toContain( 'Duplicated error' );

		consoleWarnSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	} );

	it( 'should throw when strict mode detects an unsafe output directory', () => {
		const translationService = createTranslationService();
		const compiler = createCompiler( { outputPath: '/tmp/build' } );
		const options = createOptions( { strict: true } );

		vi.mocked( fs.existsSync ).mockImplementation( filePath => filePath === path.join( '/tmp/build', 'lang' ) );

		expect( () => serveTranslations( compiler, options, translationService ) ).to.throw(
			/Can't remove path to translation files directory/
		);
	} );

	it( 'should register webpack 4 hooks, load packages, and emit assets', () => {
		const translationService = createTranslationService();
		const compiler = createCompiler( { outputPath: '/project/dist' } );
		const options = createOptions( {
			includeCorePackageTranslations: true,
			corePackagePattern: /@ckeditor[/\\]ckeditor5-core/
		} );
		const compilation = createCompilation();
		const normalModuleFactory = createNormalModuleFactory( ( request, callback ) => {
			if ( request === options.corePackageSampleResourcePath ) {
				callback( null, '/project/node_modules/@ckeditor/ckeditor5-core/src/editor/editor.js' );
				return;
			}

			if ( request === options.corePackageContextsResourcePath ) {
				callback( null, '/project/node_modules/@ckeditor/ckeditor5-core/lang/contexts.json' );
				return;
			}

			callback( new Error( 'Unexpected request' ) );
		} );

		vi.mocked( fs.readFileSync ).mockImplementation( filePath => {
			if ( filePath === '/project/node_modules/@ckeditor/ckeditor5-core/lang/contexts.json' ) {
				return JSON.stringify( { FOO: {}, BAR: {} } );
			}

			return '';
		} );

		translationService.getAssets.mockReturnValue( [
			{ outputPath: 'main.js', outputBody: 'MAIN_TRANSLATIONS', shouldConcat: true },
			{ outputPath: 'other.js', outputBody: 'OTHER_TRANSLATIONS', shouldConcat: false },
			{ outputPath: path.join( 'lang', 'pl.js' ), outputBody: 'LANG_TRANSLATIONS', shouldConcat: false }
		] );

		serveTranslations( compiler, options, translationService );

		compiler.hooks.normalModuleFactory.call( normalModuleFactory );

		expect( translationService.loadPackage ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-core' );
		expect( translationService.addIdMessage ).toHaveBeenCalledTimes( 2 );
		expect( translationService.addIdMessage ).toHaveBeenNthCalledWith( 1, 'FOO' );
		expect( translationService.addIdMessage ).toHaveBeenNthCalledWith( 2, 'BAR' );

		compiler.hooks.compilation.call( compilation );

		const module = {
			resource: '/project/packages/ckeditor5-foo/src/file.ts',
			loaders: []
		};

		compilation.hooks.normalModuleLoader.call( {}, module );

		expect( module.loaders ).toHaveLength( 1 );
		expect( module.loaders[ 0 ].loader ).toContain( 'translatesourceloader.js' );
		expect( module.loaders[ 0 ].type ).to.equal( 'module' );
		expect( module.loaders[ 0 ].options.translateSource( 'SOURCE', 'file.ts' ) ).to.equal( 'translated:file.ts' );
		expect( translationService.translateSource ).toHaveBeenCalledWith( 'SOURCE', 'file.ts' );
		expect(
			translationService.loadPackage.mock.calls.some( call => String( call[ 0 ] ).includes( 'packages/ckeditor5-foo/' ) )
		).to.equal( true );

		compilation.hooks.optimizeChunkAssets.call( [ { files: [ 'main.js', 'other.js' ] } ] );

		expect( translationService.getAssets ).toHaveBeenCalledWith( {
			outputDirectory: 'lang',
			compilationAssetNames: [ 'main.js', 'other.js' ]
		} );

		expect( compilation.assets[ 'main.js' ] ).to.be.instanceOf( ConcatSource );
		expect( compilation.assets[ 'main.js' ].source() ).toContain( 'MAIN_TRANSLATIONS' );
		expect( compilation.assets[ 'main.js' ].source() ).toContain( 'ORIGINAL_MAIN' );
		expect( compilation.assets[ 'other.js' ] ).to.equal( 'OTHER_TRANSLATIONS' );
		expect( compilation.assets[ path.join( 'lang', 'pl.js' ) ] ).to.be.instanceOf( RawSource );
		expect( compilation.assets[ path.join( 'lang', 'pl.js' ) ].source() ).to.equal( 'LANG_TRANSLATIONS' );
	} );

	it( 'should use webpack 5 hooks and warn when core resources cannot be resolved', () => {
		const consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
		const translationService = createTranslationService();
		const compiler = createCompiler( { outputPath: '/project/dist', webpack5: true } );
		const options = createOptions( { includeCorePackageTranslations: true } );
		const compilation = createCompilation( { webpack5: true } );
		const normalModuleFactory = createNormalModuleFactory( ( request, callback ) => {
			callback( new Error( `Missing ${ request }` ) );
		} );

		translationService.getAssets.mockReturnValue( [
			{ outputPath: 'main.js', outputBody: 'WEBPACK5_TRANSLATIONS', shouldConcat: false }
		] );

		serveTranslations( compiler, options, translationService );

		compiler.hooks.normalModuleFactory.call( normalModuleFactory );
		compiler.hooks.compilation.call( compilation );

		const module = {
			resource: '/project/packages/ckeditor5-foo/src/file.ts',
			loaders: []
		};

		compiler.webpack.NormalModule.getCompilationHooks.mock.results[ 0 ].value.loader.call( {}, module );
		compilation.hooks.processAssets.call( { 'main.js': true } );

		expect( consoleWarnSpy ).toHaveBeenCalledTimes( 2 );
		expect( consoleWarnSpy.mock.calls[ 0 ][ 0 ] ).toContain( 'Cannot find the CKEditor 5 core translation package' );
		expect( consoleWarnSpy.mock.calls[ 1 ][ 0 ] ).toContain( 'Cannot find the CKEditor 5 core translation context' );
		expect( compilation.assets[ 'main.js' ] ).to.equal( 'WEBPACK5_TRANSLATIONS' );

		consoleWarnSpy.mockRestore();
	} );
} );

function createHook() {
	const callbacks = [];

	return {
		tap( _name, callback ) {
			callbacks.push( callback );
		},
		call( ...args ) {
			for ( const callback of callbacks ) {
				callback( ...args );
			}
		}
	};
}

function createCompiler( { outputPath, webpack5 = false } ) {
	const compiler = {
		options: {
			output: { path: outputPath }
		},
		hooks: {
			normalModuleFactory: createHook(),
			compilation: createHook()
		}
	};

	if ( webpack5 ) {
		const loaderHook = createHook();

		compiler.webpack = {
			NormalModule: {
				getCompilationHooks: vi.fn( () => ( { loader: loaderHook } ) )
			}
		};
	}

	return compiler;
}

function createCompilation( { webpack5 = false } = {} ) {
	return {
		assets: {
			'main.js': 'ORIGINAL_MAIN',
			'other.js': 'ORIGINAL_OTHER',
			'style.css': 'ORIGINAL_CSS'
		},
		hooks: webpack5 ? {
			processAssets: createHook()
		} : {
			normalModuleLoader: createHook(),
			optimizeChunkAssets: createHook()
		}
	};
}

function createNormalModuleFactory( resolveImplementation ) {
	return {
		getResolver() {
			return {
				resolve( _context, _cwd, request, _options, callback ) {
					resolveImplementation( request, callback );
				}
			};
		}
	};
}

function createOptions( overrides = {} ) {
	return {
		outputDirectory: 'lang',
		strict: false,
		verbose: false,
		sourceFilesPattern: /[/\\]ckeditor5-[^/\\]+[/\\]src[/\\].+\.[jt]s$/,
		packageNamesPattern: /[/\\]ckeditor5-[^/\\]+[/\\]/,
		corePackagePattern: /[/\\]ckeditor5-core/,
		corePackageSampleResourcePath: '@ckeditor/ckeditor5-core/src/editor/editor',
		corePackageContextsResourcePath: '@ckeditor/ckeditor5-core/lang/contexts.json',
		includeCorePackageTranslations: false,
		assetNamesFilter: name => name.endsWith( '.js' ),
		...overrides
	};
}

function createTranslationService() {
	class TranslationService extends EventEmitter {}

	const translationService = new TranslationService();

	translationService.translateSource = vi.fn( ( _source, sourceFile ) => `translated:${ sourceFile }` );
	translationService.loadPackage = vi.fn();
	translationService.addIdMessage = vi.fn();
	translationService.getAssets = vi.fn( () => [] );

	return translationService;
}
