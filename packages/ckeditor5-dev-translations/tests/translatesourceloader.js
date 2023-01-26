/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const translateSourceLoader = require( '../lib/translatesourceloader' );

describe( 'dev-translations/translateSourceLoader()', () => {
	const sandbox = sinon.createSandbox();

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should return translated code', () => {
		const ctx = {
			query: {
				translateSource: sandbox.spy( () => 'output' )
			},
			resourcePath: 'file.js',
			callback: sinon.stub()
		};

		const map = {};
		translateSourceLoader.call( ctx, 'Source', map );

		sinon.assert.calledOnce( ctx.query.translateSource );
		sinon.assert.calledWithExactly( ctx.query.translateSource, 'Source', 'file.js' );

		expect( ctx.callback.calledOnce ).to.equal( true );
		expect( ctx.callback.firstCall.args[ 0 ] ).to.equal( null );
		expect( ctx.callback.firstCall.args[ 1 ] ).to.equal( 'output' );
		expect( ctx.callback.firstCall.args[ 2 ] ).to.equal( map );
	} );
} );
