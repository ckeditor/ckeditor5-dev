/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'dev-env/release-tools/utils', () => {
	let getWriterOptions, sandbox, transformSpy;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		transformSpy = sandbox.spy();

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

		it( 'loads the templates', () => {
			const joinStub = sandbox.stub( path, 'join' );
			const readFileSyncStub = sandbox.stub( fs, 'readFileSync' );

			joinStub.returnsArg( 1 );
			readFileSyncStub.returnsArg( 0 );

			const writerOptions = getWriterOptions( transformSpy );

			expect( joinStub.callCount ).to.equal( 4, 'Calls "path.join"' );
			expect( readFileSyncStub.callCount ).to.equal( 4, 'Calls "fs.readFileSync"' );
			expect( writerOptions.mainTemplate ).to.equal( 'template.hbs' );
			expect( writerOptions.headerPartial ).to.equal( 'header.hbs' );
			expect( writerOptions.commitPartial ).to.equal( 'commit.hbs' );
			expect( writerOptions.footerPartial ).to.equal( 'footer.hbs' );
		} );
	} );
} );
