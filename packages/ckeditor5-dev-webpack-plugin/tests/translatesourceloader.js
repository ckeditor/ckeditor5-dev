/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const translateSourceLoader = require( '../lib/translatesourceloader' );

describe( 'webpack-plugin/translateSourceLoader()', () => {
	const sandbox = sinon.createSandbox();

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should return translated code', () => {
		const ctx = {
			options: {
				translateSource: sandbox.spy( () => 'output' )
			},
			resourcePath: 'file.js'
		};

		const result = translateSourceLoader.call( ctx, 'Source' );

		sinon.assert.calledOnce( ctx.options.translateSource );
		sinon.assert.calledWithExactly( ctx.options.translateSource, 'Source', 'file.js' );

		expect( result ).to.equal( 'output' );
	} );
} );
