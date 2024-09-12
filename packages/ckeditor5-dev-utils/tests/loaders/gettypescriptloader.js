/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import getTypeScriptLoader from '../../lib/loaders/gettypescriptloader.js';
import getDebugLoader from '../../lib/loaders/getdebugloader.js';

vi.mock( '../../lib/loaders/getdebugloader.js' );

describe( 'getTypeScriptLoader()', () => {
	it( 'should be a function', () => {
		expect( getTypeScriptLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition that allows processing `*.ts` files using esbuild-loader', () => {
		const tsLoader = getTypeScriptLoader( {
			configFile: '/home/project/configs/tsconfig.json'
		} );

		expect( tsLoader ).to.be.an( 'object' );
		expect( tsLoader ).to.have.property( 'test' );

		expect( 'C:\\Program Files\\ckeditor\\plugin.ts' ).to.match( tsLoader.test, 'Windows' );
		expect( '/home/ckeditor/plugin.ts' ).to.match( tsLoader.test, 'Linux' );

		const esbuildLoader = tsLoader.use.find( item => item.loader === 'esbuild-loader' );

		expect( esbuildLoader ).to.be.an( 'object' );
		expect( esbuildLoader ).to.have.property( 'options' );
		expect( esbuildLoader.options ).to.have.property( 'tsconfig', '/home/project/configs/tsconfig.json' );
	} );

	it( 'should return a definition that allows processing `*.ts` files using esbuild-loader (skipping `options.configFile`)', () => {
		const tsLoader = getTypeScriptLoader();

		expect( tsLoader ).to.be.an( 'object' );
		expect( tsLoader ).to.have.property( 'test' );

		expect( 'C:\\Program Files\\ckeditor\\plugin.ts' ).to.match( tsLoader.test, 'Windows' );
		expect( '/home/ckeditor/plugin.ts' ).to.match( tsLoader.test, 'Linux' );

		const esbuildLoader = tsLoader.use.find( item => item.loader === 'esbuild-loader' );

		expect( esbuildLoader ).to.be.an( 'object' );
		expect( esbuildLoader ).to.have.property( 'options' );
		expect( esbuildLoader.options ).to.have.property( 'tsconfig', 'tsconfig.json' );
	} );

	it( 'should return a definition that enables the debug loader before the typescript files', () => {
		vi.mocked( getDebugLoader ).mockReturnValue( {
			loader: 'ck-debug-loader'
		} );

		const tsLoader = getTypeScriptLoader( {
			configFile: '/home/project/configs/tsconfig.json',
			includeDebugLoader: true,
			debugFlags: [ 'ENGINE' ]
		} );

		const ckDebugLoaderIndex = tsLoader.use.findIndex( item => item.loader.endsWith( 'ck-debug-loader' ) );
		const tsLoaderIndex = tsLoader.use.findIndex( item => item.loader === 'esbuild-loader' );

		// Webpack reads the "use" array from back to the front.
		expect( ckDebugLoaderIndex ).to.equal( 1 );
		expect( tsLoaderIndex ).to.equal( 0 );
	} );

	it( 'should pass the debug options into the debug loader', () => {
		vi.mocked( getDebugLoader ).mockReturnValue( {
			loader: 'ck-debug-loader',
			options: {
				debug: true
			}
		} );

		const tsLoader = getTypeScriptLoader( {
			configFile: '/home/project/configs/tsconfig.json',
			includeDebugLoader: true,
			debugFlags: [ 'ENGINE' ]
		} );

		const debugLoader = tsLoader.use.find( item => item.loader.endsWith( 'ck-debug-loader' ) );

		expect( vi.mocked( getDebugLoader ) ).toHaveBeenCalledExactlyOnceWith( [ 'ENGINE' ] );

		expect( debugLoader ).to.be.an( 'object' );

		expect( debugLoader ).to.have.property( 'loader' );
		expect( debugLoader.loader ).to.equal( 'ck-debug-loader' );
		expect( debugLoader ).to.have.property( 'options' );
		expect( debugLoader.options ).to.be.an( 'object' );
		expect( debugLoader.options ).to.have.property( 'debug', true );
	} );
} );
