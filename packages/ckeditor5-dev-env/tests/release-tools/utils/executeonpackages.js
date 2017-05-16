/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'executeOnPackages()', () => {
		let executeOnPackages, sandbox;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			executeOnPackages = require( '../../../lib/release-tools/utils/executeonpackages' );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'resolves promsie when package list is empty', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );

			return executeOnPackages( new Set() )
				.then( () => {
					expect( functionToExecute.called ).to.equal( false );
				} );
		} );

		it( 'executes a function for each package found as a dependency in package.json in CWD', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );

			const packages = new Set( [
				'/packages/ckeditor5-core',
				'/packages/ckeditor5-engine',
			] );

			return executeOnPackages( packages, functionToExecute )
				.then( () => {
					expect( functionToExecute.calledTwice ).to.equal( true );
					expect( functionToExecute.firstCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-core' );
					expect( functionToExecute.secondCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-engine' );
				} );
		} );

		it( 'waits for each callback', () => {
			const order = [];

			function functionToExecute( pathToSinglePackage ) {
				return new Promise( resolve => {
					order.push( pathToSinglePackage + ':started' );

					setTimeout( () => {
						order.push( pathToSinglePackage + ':resolved' );
						resolve();
					} );
				} );
			}

			const packages = new Set( [
				'/packages/ckeditor5-core',
				'/packages/ckeditor5-engine',
			] );

			return executeOnPackages( packages, functionToExecute )
				.then( () => {
					expect( order ).to.deep.equal( [
						'/packages/ckeditor5-core:started',
						'/packages/ckeditor5-core:resolved',
						'/packages/ckeditor5-engine:started',
						'/packages/ckeditor5-engine:resolved'
					] );
				} );
		} );
	} );
} );
