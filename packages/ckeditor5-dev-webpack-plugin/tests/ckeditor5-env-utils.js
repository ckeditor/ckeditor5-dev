/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const originalPath = require( 'path' );
const mockery = require( 'mockery' );

describe( 'webpack-plugin/ckeditor5-env-utils', () => {
	const sandbox = sinon.createSandbox();
	let cke5envUtils;
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
		cke5envUtils = require( '../lib/ckeditor5-env-utils' );
	} );

	after( () => {
		mockery.disable();
		mockery.deregisterAll();
	} );

	describe( 'getCorePackageSampleResource()', () => {
		it( 'should return path to the core\'s sample resource', () => {
			const resource = cke5envUtils.getCorePackageSampleResource();

			expect( resource ).to.equal( '@ckeditor/ckeditor5-core/src/editor/editor.js' );
		} );
	} );

	describe( 'getCorePackagePath()', () => {
		it( 'should return path to the core package', () => {
			const pathToCorePackage = cke5envUtils.getCorePackagePath( 'cke5/node_modules/@ckeditor/ckeditor5-core/src/editor/editor.js' );

			expect( pathToCorePackage ).to.equal( 'cke5/node_modules/@ckeditor/ckeditor5-core' );
		} );
	} );

	describe( 'getPathToPackage()', () => {
		it( 'should return package if the path match the regexp', () => {
			const pathToPackage = cke5envUtils.getPathToPackage( 'path', 'path/to/@ckeditor/ckeditor5-utils/src/util.js' );

			expect( pathToPackage ).to.equal( 'to/@ckeditor/ckeditor5-utils/' );
		} );

		it( 'should return null if the path does not match the regexp', () => {
			const pathToPackage = cke5envUtils.getPathToPackage( 'path', 'path/to/@ckeditor/ckeditor5/src/util.js' );

			expect( pathToPackage ).to.equal( null );
		} );

		it( 'should work with Windows paths', () => {
			useWindowsPaths();

			const pathToPackage = cke5envUtils.getPathToPackage( 'path', 'path\\to\\@ckeditor\\ckeditor5-utils\\src\\util.js' );

			expect( pathToPackage ).to.equal( 'to\\@ckeditor\\ckeditor5-utils\\' );
		} );

		it( 'should work with nested ckeditor5 packages', () => {
			const pathToPackage = cke5envUtils.getPathToPackage(
				'path/to/ckeditor5-build-classic',
				'path/to/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5-utils/src/util.js'
			);

			expect( pathToPackage ).to.equal( 'node_modules/@ckeditor/ckeditor5-utils/' );
		} );
	} );

	describe( 'getLoaders()', () => {
		it( 'should return an array of loaders if the resource\'s path match the RegExp on posix systems', () => {
			const cwd = 'path';
			const resource = 'path/to/@ckeditor/ckeditor5-utils/src/util.js';
			const loaders = [];
			const options = {};

			const newLoaders = cke5envUtils.getLoaders( cwd, resource, loaders, options );

			expect( newLoaders ).to.deep.equal( [
				{
					loader: originalPath.normalize( originalPath.join( __dirname, '../lib/translatesourceloader.js' ) ),
					options,
				}
			] );
		} );

		it( 'should not change the original array of loaders', () => {
			const cwd = 'path';
			const resource = 'path/to/@ckeditor/ckeditor5-utils/src/util.js';
			const loaders = [];
			const options = {};

			cke5envUtils.getLoaders( cwd, resource, loaders, options );

			expect( loaders ).to.deep.equal( [] );
		} );

		it( 'should add a loader to the resource if the resource\'s path match the RegExp on the Windows systems', () => {
			useWindowsPaths();

			const cwd = 'path';
			const resource = 'path\\to\\@ckeditor\\ckeditor5-utils\\src\\util.js';
			const loaders = [];
			const options = {};

			const newLoaders = cke5envUtils.getLoaders( cwd, resource, loaders, options );

			expect( newLoaders ).to.deep.equal( [ {
				loader: path.normalize( path.join( __dirname, '..\\lib\\translatesourceloader.js' ) ),
				options,
			} ] );
		} );

		it( 'should not add a loader to the resource if the resource\'s path do not match the RegExp on posix systems', () => {
			const cwd = 'path';
			const resource = 'path/to/@ckeditor/ckeditor5/src/util.js';
			const loaders = [];
			const options = {};

			const newLoaders = cke5envUtils.getLoaders( cwd, resource, loaders, options );

			expect( newLoaders.length ).to.equal( 0 );
		} );

		it( 'should work with nested ckeditor5 packages', () => {
			const cwd = 'path/to/ckeditor5-build-classic';
			const resource = 'path/to/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5/src/util.js';
			const loaders = [];
			const options = {};

			const newLoaders = cke5envUtils.getLoaders( cwd, resource, loaders, options );

			expect( newLoaders.length ).to.equal( 0 );
		} );

		it( 'should work with nested ckeditor5 packages #2', () => {
			const cwd = 'path/to/ckeditor5-build-classic';
			const resource = 'path/to/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5-utils/src/util.js';
			const loaders = [];
			const options = {};

			const newLoaders = cke5envUtils.getLoaders( cwd, resource, loaders, options );

			expect( newLoaders ).does.deep.equal( [ {
				loader: path.normalize( path.join( __dirname, '../lib/translatesourceloader.js' ) ),
				options,
			} ] );
		} );
	} );
} );

