/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = chai.expect;

describe( 'styles', () => {
	let getPostCssConfig, stubs;

	beforeEach( () => {
		stubs = {
			'./themeimporter': sinon.stub().returns( 'postcss-ckeditor5-theme-importer' ),
			'postcss-import': sinon.stub().returns( 'postcss-import' ),
			'postcss-mixins': sinon.stub().returns( 'postcss-mixins' ),
			'postcss-nesting': sinon.stub().returns( 'postcss-nesting' ),
			'./themelogger': sinon.stub().returns( 'postcss-ckeditor5-theme-logger' ),
			cssnano: sinon.stub().returns( 'cssnano' )
		};

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		for ( const stub in stubs ) {
			mockery.registerMock( stub, stubs[ stub ] );
		}

		getPostCssConfig = require( '../../lib/styles/getpostcssconfig' );
	} );

	afterEach( () => {
		mockery.disable();
	} );

	describe( 'getPostCssConfig()', () => {
		it( 'returns PostCSS plugins', () => {
			expect( getPostCssConfig().plugins )
				.to.have.members( [
					'postcss-import',
					'postcss-ckeditor5-theme-importer',
					'postcss-mixins',
					'postcss-nesting',
					'postcss-ckeditor5-theme-logger'
				] );
		} );

		it( 'passes options to the theme importer', () => {
			getPostCssConfig( {
				themeImporter: {
					themePath: 'abc',
					debug: true
				}
			} );

			sinon.assert.calledWithExactly( stubs[ './themeimporter' ], {
				themePath: 'abc',
				debug: true
			} );
		} );

		it( 'supports #sourceMap option', () => {
			expect( getPostCssConfig( { sourceMap: true } ).sourceMap )
				.to.equal( 'inline' );
		} );

		it( 'supports #minify option', () => {
			expect( getPostCssConfig( { minify: true } ).plugins.pop() )
				.to.equal( 'cssnano' );
		} );
	} );
} );
