/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;

describe( 'bundler', () => {
	let getPlugins;

	beforeEach( () => {
		getPlugins = require( '../../lib/bundler/getplugins' );
	} );

	describe( 'getPlugins()', () => {
		it( 'returns plugin names and paths', () => {
			const plugins = getPlugins( [
				'@ckeditor/ckeditor5-presets/src/article',
				'@ckeditor/ckeditor5-basic-styles/src/bold',
				'@ckeditor/ckeditor5-basic-styles/src/italic'
			] );

			expect( plugins ).to.have.property( 'ArticlePlugin', '@ckeditor/ckeditor5-presets/src/article' );
			expect( plugins ).to.have.property( 'BoldPlugin', '@ckeditor/ckeditor5-basic-styles/src/bold' );
			expect( plugins ).to.have.property( 'ItalicPlugin', '@ckeditor/ckeditor5-basic-styles/src/italic' );
		} );

		it( 'does not duplicate plugins with the same name', () => {
			const plugins = getPlugins( [
				'@ckeditor/ckeditor5-presets/src/article',
				'ckeditor5-foo/src/article',
			] );

			expect( plugins ).to.have.property( 'ArticlePlugin', '@ckeditor/ckeditor5-presets/src/article' );
			expect( plugins ).to.have.property( 'Article1Plugin', 'ckeditor5-foo/src/article' );
		} );
	} );
} );
