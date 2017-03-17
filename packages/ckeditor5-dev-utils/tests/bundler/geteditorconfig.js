/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;

describe( 'bundler', () => {
	let getEditorConfig;

	beforeEach( () => {
		getEditorConfig = require( '../../lib/bundler/geteditorconfig' );
	} );

	describe( 'getEditorConfig()', () => {
		it( 'returns empty object as string if config was not specified', () => {
			expect( getEditorConfig() ).to.equal( '{}' );
		} );

		it( 'returns given object as string with proper indents', () => {
			const config = {
				foo: 1,
				bar: [ 1, 2, 3 ],
				plugin: {
					enabled: true,
					key: 'PRIVATE_KEY'
				}
			};

			const expectedConfig = `{
		foo: 1,
		bar: [
			1,
			2,
			3
		],
		plugin: {
			enabled: true,
			key: 'PRIVATE_KEY'
		}
	}`;

			expect( getEditorConfig( config ) ).to.equal( expectedConfig );
		} );
	} );
} );
