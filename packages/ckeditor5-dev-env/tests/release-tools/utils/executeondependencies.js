/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { workspace: workspaceUtils } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'executeOnDependencies()', () => {
		let executeOnDependencies, sandbox;

		beforeEach( () => {
			executeOnDependencies = require( '../../../lib/release-tools/utils/executeondependencies' );

			sandbox = sinon.sandbox.create();
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'executes a function for each package', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );

			const getDirectoriesStub = sandbox.stub( workspaceUtils, 'getDirectories' )
				.returns( [ 'ckeditor5-core', 'ckeditor5-engine' ] );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				packages: 'packages/'
			};

			const packagesPath = path.join( options.cwd, options.packages );

			return executeOnDependencies( options, functionToExecute )
				.then( () => {
					expect( getDirectoriesStub.calledOnce ).to.equal( true );

					expect( functionToExecute.calledTwice ).to.equal( true );
					expect( functionToExecute.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-core' );
					expect( functionToExecute.firstCall.args[ 1 ] ).to.equal( path.join( packagesPath, 'ckeditor5-core' ) );
					expect( functionToExecute.secondCall.args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-engine' );
					expect( functionToExecute.secondCall.args[ 1 ] ).to.equal( path.join( packagesPath, 'ckeditor5-engine' ) );
				} );
		} );

		it( 'waits for each callback', () => {
			const order = [];

			function functionToExecute( dependency ) {
				return new Promise( ( resolve ) => {
					order.push( dependency + '-started' );

					setTimeout( () => {
						order.push( dependency + '-resolved' );
						resolve();
					} );
				} );
			}

			sandbox.stub( workspaceUtils, 'getDirectories' )
				.returns( [ 'ckeditor5-core', 'ckeditor5-engine' ] );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				packages: 'packages/'
			};

			return executeOnDependencies( options, functionToExecute )
				.then( () => {
					expect( order ).to.deep.equal( [
						'ckeditor5-core-started',
						'ckeditor5-core-resolved',
						'@ckeditor/ckeditor5-engine-started',
						'@ckeditor/ckeditor5-engine-resolved'
					] );
				} );
		} );
	} );
} );
