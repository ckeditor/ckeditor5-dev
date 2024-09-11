/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';


describe( 'getIconsLoader()', () => {
	it( 'should be a function', () => {
		expect( loaders.getIconsLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition loading the svg files properly (a full CKEditor 5 icon path check)', () => {
		const svgLoader = loaders.getIconsLoader();

		expect( svgLoader ).to.be.an( 'object' );
		expect( svgLoader ).to.have.property( 'use' );
		expect( svgLoader.use ).to.include( 'raw-loader' );
		expect( svgLoader ).to.have.property( 'test' );

		const svgRegExp = svgLoader.test;

		expect( 'C:\\Program Files\\ckeditor\\ckeditor5-basic-styles\\theme\\icons\\italic.svg' ).to.match( svgRegExp, 'Windows' );
		expect( '/home/ckeditor/ckeditor5-basic-styles/theme/icons/italic.svg' ).to.match( svgRegExp, 'Linux' );
	} );

	it( 'should return a definition loading the svg files properly (accept any svg file)', () => {
		const svgLoader = loaders.getIconsLoader( { matchExtensionOnly: true } );

		expect( svgLoader ).to.be.an( 'object' );
		expect( svgLoader ).to.have.property( 'use' );
		expect( svgLoader.use ).to.include( 'raw-loader' );
		expect( svgLoader ).to.have.property( 'test' );

		const svgRegExp = svgLoader.test;

		expect( 'C:\\Program Files\\ckeditor\\italic.svg' ).to.match( svgRegExp, 'Windows' );
		expect( '/home/ckeditor/italic.svg' ).to.match( svgRegExp, 'Linux' );
	} );
} );
