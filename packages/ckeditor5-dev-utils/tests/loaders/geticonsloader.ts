/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getIconsLoader from '../../src/loaders/geticonsloader.js';

describe( 'getIconsLoader()', () => {
	it( 'should be a function', () => {
		expect( getIconsLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition loading the svg files properly (a full CKEditor 5 icon path check)', () => {
		const svgLoader = getIconsLoader();

		expect( svgLoader ).to.be.an( 'object' );
		expect( svgLoader ).to.have.property( 'use' );
		expect( svgLoader.use[ 0 ] ).to.include( 'raw-loader' );
		expect( svgLoader ).to.have.property( 'test' );

		const svgRegExp = svgLoader.test;

		expect( 'C:\\Program Files\\ckeditor\\ckeditor5-basic-styles\\theme\\icons\\italic.svg' ).to.match( svgRegExp, 'Windows' );
		expect( '/home/ckeditor/ckeditor5-basic-styles/theme/icons/italic.svg' ).to.match( svgRegExp, 'Linux' );
	} );

	it( 'should return a definition loading the svg files properly (accept any svg file)', () => {
		const svgLoader = getIconsLoader( { matchExtensionOnly: true } );

		expect( svgLoader ).to.be.an( 'object' );
		expect( svgLoader ).to.have.property( 'use' );
		expect( svgLoader.use[ 0 ] ).to.include( 'raw-loader' );
		expect( svgLoader ).to.have.property( 'test' );

		const svgRegExp = svgLoader.test;

		expect( 'C:\\Program Files\\ckeditor\\italic.svg' ).to.match( svgRegExp, 'Windows' );
		expect( '/home/ckeditor/italic.svg' ).to.match( svgRegExp, 'Linux' );
	} );
} );
