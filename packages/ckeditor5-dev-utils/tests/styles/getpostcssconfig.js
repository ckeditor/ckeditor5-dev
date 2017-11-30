/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = chai.expect;

describe( 'styles', () => {
	let getPostCssConfig;

	beforeEach( () => {
		getPostCssConfig = require( '../../lib/styles/getpostcssconfig' );
	} );

	afterEach( () => {
		mockery.disable();
	} );

	describe( 'getPostCssConfig()', () => {
		it( 'returns PostCSS plugins', () => {
			expect( getPostCssConfig().plugins.map( p => p.postcssPlugin ) )
				.to.have.members( [
					'postcss-import',
					'postcss-ckeditor5-theme-importer',
					'postcss-mixins',
					'postcss-nesting',
					'postcss-ckeditor5-theme-logger'
				] );
		} );

		it( 'passes options to the theme importer', () => {
			const themeImporterSpy = sinon.spy();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( './themeimporter', themeImporterSpy );

			getPostCssConfig( {
				themeImporter: {
					themePath: 'abc',
					debug: true
				}
			} );

			sinon.assert.calledWithExactly( themeImporterSpy, {
				themePath: 'abc',
				debug: true
			} );
		} );

		it( 'supports #sourceMap option', () => {
			expect( getPostCssConfig( { sourceMap: true } ).sourceMap )
				.to.equal( 'inline' );
		} );

		it( 'supports #minify option', () => {
			expect( getPostCssConfig( { minify: true } ).plugins.pop().postcssPlugin )
				.to.equal( 'cssnano' );
		} );
	} );
} );
