/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getFormattedTextLoader from '../../src/loaders/getformattedtextloader.js';

describe( 'getFormattedTextLoader()', () => {
	it( 'should be a function', () => {
		expect( getFormattedTextLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition accepting files that store readable content', () => {
		const textLoader = getFormattedTextLoader();

		expect( textLoader ).to.be.an( 'object' );
		expect( textLoader ).to.have.property( 'use' );
		expect( textLoader.use[ 0 ] ).to.include( 'raw-loader' );
		expect( textLoader ).to.have.property( 'test' );

		const loaderRegExp = textLoader.test;

		expect( 'C:\\Program Files\\ckeditor\\italic.html' ).to.match( loaderRegExp, 'HTML: Windows' );
		expect( '/home/ckeditor/italic.html' ).to.match( loaderRegExp, 'HTML: Linux' );

		expect( 'C:\\Program Files\\ckeditor\\italic.txt' ).to.match( loaderRegExp, 'TXT: Windows' );
		expect( '/home/ckeditor/italic.txt' ).to.match( loaderRegExp, 'TXT: Linux' );

		expect( 'C:\\Program Files\\ckeditor\\italic.rtf' ).to.match( loaderRegExp, 'RTF: Windows' );
		expect( '/home/ckeditor/italic.rtf' ).to.match( loaderRegExp, 'RTF: Linux' );
	} );
} );
