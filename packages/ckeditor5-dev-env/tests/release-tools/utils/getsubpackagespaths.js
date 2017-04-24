/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'getSubPackagesPaths()', () => {
		let getSubPackagesPaths, sandbox, getPackageJsonStub,
			getDirectoriesStub;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			getPackageJsonStub = sandbox.stub();
			getDirectoriesStub = sandbox.stub();

			mockery.registerMock( './getpackagejson', getPackageJsonStub );
			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
				tools: {
					getDirectories: getDirectoriesStub
				}
			} );

			sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

			getSubPackagesPaths = require( '../../../lib/release-tools/utils/getsubpackagespaths' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'returns all found packages', () => {
			getDirectoriesStub.returns( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils'
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: []
			};

			getPackageJsonStub.onFirstCall().returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onSecondCall().returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onThirdCall().returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getSubPackagesPaths( options );

			expect( pathsCollection.packages ).to.be.instanceof( Set );
			expect( pathsCollection.packages.size ).to.equal( 3 );
			expect( pathsCollection.packages.has( '/tmp/packages/ckeditor5-core' ) ).to.equal( true );
			expect( pathsCollection.packages.has( '/tmp/packages/ckeditor5-engine' ) ).to.equal( true );
			expect( pathsCollection.packages.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );
		} );

		it( 'allows ignoring specified packages', () => {
			getDirectoriesStub.returns( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils',
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [
					'@ckeditor/ckeditor5-utils'
				]
			};

			getPackageJsonStub.onFirstCall().returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onSecondCall().returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onThirdCall().returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getSubPackagesPaths( options );

			expect( pathsCollection.packages ).to.be.instanceof( Set );
			expect( pathsCollection.packages.size ).to.equal( 2 );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 1 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );
		} );
	} );
} );
