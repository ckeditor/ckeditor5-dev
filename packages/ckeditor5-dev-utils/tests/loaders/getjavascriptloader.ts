/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import getJavaScriptLoader from '../../src/loaders/getjavascriptloader.js';
import getDebugLoader from '../../src/loaders/getdebugloader.js';

vi.mock( '../../src/loaders/getdebugloader.js' );

describe( 'getJavaScriptLoader()', () => {
	it( 'should be a function', () => {
		expect( getJavaScriptLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition that enables the ck-debug-loader', () => {
		vi.mocked( getDebugLoader ).mockReturnValue( {
			loader: 'ck-debug-loader',
			options: {
				debug: true
			} as any
		} );

		const debugLoader = getJavaScriptLoader( {
			debugFlags: [ 'ENGINE' ]
		} );

		expect( vi.mocked( getDebugLoader ) ).toHaveBeenCalledExactlyOnceWith( [ 'ENGINE' ] );

		expect( debugLoader ).to.be.an( 'object' );
		expect( debugLoader ).to.have.property( 'test' );

		expect( 'C:\\Program Files\\ckeditor\\plugin.js' ).to.match( debugLoader.test, 'Windows' );
		expect( '/home/ckeditor/plugin.js' ).to.match( debugLoader.test, 'Linux' );

		expect( debugLoader ).to.have.property( 'loader' );
		expect( debugLoader.loader ).to.equal( 'ck-debug-loader' );
		expect( debugLoader ).to.have.property( 'options' );
		expect( debugLoader.options ).to.be.an( 'object' );
		expect( debugLoader.options ).to.have.property( 'debug', true );
	} );
} );
