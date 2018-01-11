/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
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
				firstKey: 1,
				secondKey: [ 1, 2, 3 ],
				plugin: {
					enabled: true,
					key: 'PRIVATE_KEY'
				},
				'key with spaces': null,
				anotherKey: 'Key with "quotation marks".'
			};

			const expectedConfig = `{
		firstKey: 1,
		secondKey: [
			1,
			2,
			3
		],
		plugin: {
			enabled: true,
			key: 'PRIVATE_KEY'
		},
		'key with spaces': null,
		anotherKey: 'Key with "quotation marks".'
	}`;

			expect( getEditorConfig( config ) ).to.equal( expectedConfig );
		} );
	} );
} );
