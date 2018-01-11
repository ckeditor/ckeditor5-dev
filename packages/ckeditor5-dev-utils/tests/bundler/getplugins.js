/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
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
				'@ckeditor/ckeditor5-essentials/src/essentials',
				'@ckeditor/ckeditor5-basic-styles/src/bold',
				'@ckeditor/ckeditor5-basic-styles/src/italic'
			] );

			expect( plugins ).to.have.property( 'EssentialsPlugin', '@ckeditor/ckeditor5-essentials/src/essentials' );
			expect( plugins ).to.have.property( 'BoldPlugin', '@ckeditor/ckeditor5-basic-styles/src/bold' );
			expect( plugins ).to.have.property( 'ItalicPlugin', '@ckeditor/ckeditor5-basic-styles/src/italic' );
		} );

		it( 'does not duplicate plugins with the same name', () => {
			const plugins = getPlugins( [
				'@ckeditor/ckeditor5-essentials/src/essentials',
				'ckeditor5-foo/src/essentials',
			] );

			expect( plugins ).to.have.property( 'EssentialsPlugin', '@ckeditor/ckeditor5-essentials/src/essentials' );
			expect( plugins ).to.have.property( 'Essentials1Plugin', 'ckeditor5-foo/src/essentials' );
		} );
	} );
} );
