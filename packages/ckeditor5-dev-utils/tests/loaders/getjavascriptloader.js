/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';


describe( 'getJavaScriptLoader()', () => {
	it( 'should be a function', () => {
		expect( loaders.getJavaScriptLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition that enables the ck-debug-loader', () => {
		const debugLoader = loaders.getJavaScriptLoader( {
			debugFlags: [ 'ENGINE' ]
		} );

		expect( debugLoader ).to.be.an( 'object' );
		expect( debugLoader ).to.have.property( 'test' );

		expect( 'C:\\Program Files\\ckeditor\\plugin.js' ).to.match( debugLoader.test, 'Windows' );
		expect( '/home/ckeditor/plugin.js' ).to.match( debugLoader.test, 'Linux' );

		expect( debugLoader ).to.have.property( 'loader' );
		expect( debugLoader.loader.endsWith( 'ck-debug-loader' ) ).to.equal( true );
		expect( debugLoader ).to.have.property( 'options' );
		expect( debugLoader.options ).to.be.an( 'object' );
		expect( debugLoader.options ).to.have.property( 'debugFlags' );
		expect( debugLoader.options.debugFlags ).to.be.an( 'array' );
		expect( debugLoader.options.debugFlags ).to.include( 'ENGINE' );
	} );
} );
