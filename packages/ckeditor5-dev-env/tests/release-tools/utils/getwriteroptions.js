/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe.only( 'dev-env/release-tools/utils', () => {
	let getWriterOptions, sandbox, transformSpy;

	beforeEach( () => {
		transformSpy = sinon.spy();
		sandbox = sinon.sandbox.create();

		getWriterOptions = require( '../../../lib/release-tools/utils/getwriteroptions' );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'getWriterOptions()', () => {
		it( 'returns an object with writer options', () => {
			const writerOptions = getWriterOptions( transformSpy );

			expect( writerOptions ).to.have.property( 'transform', transformSpy );
			expect( writerOptions ).to.have.property( 'groupBy' );
			expect( writerOptions ).to.have.property( 'commitGroupsSort' );
			expect( writerOptions ).to.have.property( 'commitsSort' );
			expect( writerOptions ).to.have.property( 'noteGroupsSort' );
			expect( writerOptions ).to.have.property( 'notesSort' );
			expect( writerOptions ).to.have.property( 'mainTemplate' );
			expect( writerOptions ).to.have.property( 'headerPartial' );
			expect( writerOptions ).to.have.property( 'footerPartial' );

			expect( writerOptions.commitsSort ).to.be.a( 'array' );
			expect( writerOptions.commitGroupsSort ).to.be.a( 'function' );
			expect( writerOptions.noteGroupsSort ).to.be.a( 'function' );
			expect( writerOptions.notesSort ).to.be.a( 'function' );
		} );
	} );
} );
