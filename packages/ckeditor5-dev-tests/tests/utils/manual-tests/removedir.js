/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );

describe( 'removeDir', () => {
	let sandbox;
	const logMessages = [];
	const deletedPaths = [];
	let removeDir;

	before( () => {
		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			logger: () => ( {
				info( message ) {
					logMessages.push( message );
				}
			} )
		} );

		mockery.registerMock( 'del', ( path ) => {
			return Promise.resolve().then( () => {
				deletedPaths.push( path );
			} );
		} );

		mockery.registerMock( 'gulp-util', {
			colors: {
				cyan: ( message ) => `\u001b[36m${ message }\u001b[39m`
			}
		} );

		removeDir = require( '../../../lib/utils/manual-tests/removedir' );
		sandbox = sinon.sandbox.create();
	} );

	after( () => {
		mockery.disable();
		mockery.deregisterAll();
	} );

	afterEach( () => {
		sandbox.restore();
		logMessages.length = 0;
		deletedPaths.length = 0;
	} );

	it( 'should remove directory and log it', () => {
		return removeDir( 'workspace/directory' ).then( () => {
			expect( logMessages ).to.deep.equal( [
				'Removed directory \'\u001b[36mworkspace/directory\u001b[39m\''
			] );

			expect( deletedPaths ).to.deep.equal( [
				'workspace/directory'
			] );
		} );
	} );
} );
