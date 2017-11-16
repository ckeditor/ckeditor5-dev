/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const originalPath = require( 'path' );
const mockery = require( 'mockery' );

describe( 'webpack-plugin/ckeditor5-env-utils', () => {
	const sandbox = sinon.createSandbox();
	let envUtils;
	const path = {};

	function useWindowsPaths() {
		Object.assign( path, originalPath.win32 );
	}

	beforeEach( () => {
		// Use posix by default.
		Object.assign( path, originalPath.posix );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	before( () => {
		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true
		} );

		mockery.registerMock( 'path', path );
		envUtils = require( '../lib/ckeditor5-env-utils' );
	} );

	after( () => {
		mockery.disable();
		mockery.deregisterAll();
	} );

	describe( 'loadCoreTranslations()', () => {
		it( 'should load core translations', () => {
			const resolver = {
				resolve: ( context, requester, request, cb ) => {
					cb( null, 'path/to/' + request );
				}
			};

			const translationService = {
				loadPackage: sandbox.spy()
			};

			envUtils.loadCoreTranslations( 'cwd', translationService, resolver );

			sinon.assert.calledOnce( translationService.loadPackage );
			sinon.assert.calledWithExactly(
				translationService.loadPackage,
				'path/to/@ckeditor/ckeditor5-core'
			);
		} );
	} );

	describe( 'maybeLoadPackage()', () => {
		it( 'should load package if the path match the regexp', () => {
			const translationService = {
				loadPackage: sandbox.spy()
			};

			envUtils.maybeLoadPackage( 'path', translationService, 'path/to/@ckeditor/ckeditor5-utils/src/util.js' );

			sinon.assert.calledOnce( translationService.loadPackage );
			sinon.assert.calledWithExactly( translationService.loadPackage, 'to/@ckeditor/ckeditor5-utils/' );
		} );

		it( 'should not load package if the path do not match the regexp', () => {
			const translationService = {
				loadPackage: sandbox.spy()
			};

			envUtils.maybeLoadPackage( 'path', translationService, 'path/to/@ckeditor/ckeditor5/src/util.js' );

			sinon.assert.notCalled( translationService.loadPackage );
		} );

		it( 'should work with Windows paths', () => {
			useWindowsPaths();

			const translationService = {
				loadPackage: sandbox.spy()
			};

			envUtils.maybeLoadPackage( 'path', translationService, 'path\\to\\@ckeditor\\ckeditor5-utils\\src\\util.js' );

			sinon.assert.calledOnce( translationService.loadPackage );
			sinon.assert.calledWithExactly( translationService.loadPackage, 'to\\@ckeditor\\ckeditor5-utils\\' );
		} );

		it( 'should work with nested ckeditor5 packages', () => {
			const translationService = {
				loadPackage: sandbox.spy()
			};

			envUtils.maybeLoadPackage(
				'path/to/ckeditor5-build-classic',
				translationService,
				'path/to/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5-utils/src/util.js'
			);

			sinon.assert.calledOnce( translationService.loadPackage );
			sinon.assert.calledWithExactly( translationService.loadPackage, 'node_modules/@ckeditor/ckeditor5-utils/' );
		} );
	} );

	describe( 'maybeAddLoader()', () => {
		it( 'should add a loader ot the resource if the resource\'s path match the RegExp on posix systems', () => {
			const cwd = 'path';
			const resource = 'path/to/@ckeditor/ckeditor5-utils/src/util.js';
			const loaders = [];

			envUtils.maybeAddLoader( cwd, resource, loaders );

			expect( loaders ).does.deep.equal( [
				originalPath.normalize( originalPath.join( __dirname, '../lib/translatesourceloader.js' ) )
			] );
		} );

		it( 'should add a loader ot the resource if the resource\'s path match the RegExp on the Windows systems', () => {
			useWindowsPaths();

			const cwd = 'path';
			const resource = 'path\\to\\@ckeditor\\ckeditor5-utils\\src\\util.js';
			const loaders = [];

			envUtils.maybeAddLoader( cwd, resource, loaders );

			expect( loaders ).does.deep.equal( [
				path.normalize( path.join( __dirname, '..\\lib\\translatesourceloader.js' ) )
			] );
		} );

		it( 'should not add a loader ot the resource if the resource\'s path do not match the RegExp on posix systems', () => {
			const cwd = 'path';
			const resource = 'path/to/@ckeditor/ckeditor5/src/util.js';
			const loaders = [];

			envUtils.maybeAddLoader( cwd, resource, loaders );

			expect( loaders.length ).to.equal( 0 );
		} );

		it( 'should work with nested ckeditor5 packages', () => {
			const cwd = 'path/to/ckeditor5-build-classic';
			const resource = 'path/to/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5/src/util.js';
			const loaders = [];

			envUtils.maybeAddLoader( cwd, resource, loaders );

			expect( loaders.length ).to.equal( 0 );
		} );

		it( 'should work with nested ckeditor5 packages #2', () => {
			const cwd = 'path/to/ckeditor5-build-classic';
			const resource = 'path/to/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5-utils/src/util.js';
			const loaders = [];

			envUtils.maybeAddLoader( cwd, resource, loaders );

			expect( loaders ).does.deep.equal( [
				path.normalize( path.join( __dirname, '../lib/translatesourceloader.js' ) )
			] );
		} );
	} );
} );

