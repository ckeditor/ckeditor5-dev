/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-release-tools/utils', () => {
	describe( 'getPackagesPaths()', () => {
		let getPackagesPaths, sandbox, getPackageJsonStub, getDirectoriesStub;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			getPackageJsonStub = sandbox.stub();
			getDirectoriesStub = sandbox.stub();

			sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

			getPackagesPaths = proxyquire( '../../lib/utils/getpackagespaths', {
				'./getpackagejson': getPackageJsonStub,
				'@ckeditor/ckeditor5-dev-utils': {
					tools: {
						getDirectories: getDirectoriesStub
					}
				}
			} );
		} );

		afterEach( () => {
			sandbox.restore();
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
				skipPackages: [],
				skipMainRepository: true
			};

			getPackageJsonStub.onCall( 0 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 3 );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-core' ) ).to.equal( true );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-engine' ) ).to.equal( true );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 1 );
			expect( pathsCollection.skipped.has( '/tmp' ) ).to.equal( true );
		} );

		it( 'allows ignoring specified packages (specified as array)', () => {
			getDirectoriesStub.returns( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils'
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [
					'@ckeditor/ckeditor5-utils'
				],
				skipMainRepository: true
			};

			getPackageJsonStub.onCall( 0 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 2 );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 2 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp' ) ).to.equal( true );
		} );

		it( 'allows ignoring specified packages (specified as string)', () => {
			getDirectoriesStub.returns( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils'
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: '@ckeditor/ckeditor5-u*',
				skipMainRepository: true
			};
			getPackageJsonStub.onCall( 0 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 2 );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 2 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp' ) ).to.equal( true );
		} );

		it( 'allows restricting the scope for packages', () => {
			getDirectoriesStub.returns( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils',
				'ckeditor5-build-classic',
				'ckeditor5-build-inline'
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				scope: '@ckeditor/ckeditor5-build-*',
				skipPackages: [],
				skipMainRepository: true
			};

			getPackageJsonStub.onCall( 0 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-utils' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-build-classic' } );
			getPackageJsonStub.onCall( 4 ).returns( { name: '@ckeditor/ckeditor5-build-inline' } );

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 2 );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-build-classic' ) ).to.equal( true );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-build-inline' ) ).to.equal( true );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 4 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-core' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-engine' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp' ) ).to.equal( true );
		} );

		it( 'allows restricting the scope for packages and works fine with "skipPackages" option', () => {
			getDirectoriesStub.returns( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils',
				'ckeditor5-build-classic',
				'ckeditor5-build-inline'
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				scope: '@ckeditor/ckeditor5-build-*',
				skipPackages: [
					'@ckeditor/ckeditor5-build-inline'
				],
				skipMainRepository: true
			};

			getPackageJsonStub.onCall( 0 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-utils' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-build-classic' } );
			getPackageJsonStub.onCall( 4 ).returns( { name: '@ckeditor/ckeditor5-build-inline' } );

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 1 );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-build-classic' ) ).to.equal( true );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 5 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-core' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-engine' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-build-inline' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp' ) ).to.equal( true );
		} );

		it( 'allows returning the main repository', () => {
			getDirectoriesStub.returns( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils',
				'ckeditor5-build-classic',
				'ckeditor5-build-inline'
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [
					'@ckeditor/ckeditor5-*'
				],
				skipMainRepository: false
			};

			getPackageJsonStub.onCall( 0 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-utils' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-build-classic' } );
			getPackageJsonStub.onCall( 4 ).returns( { name: '@ckeditor/ckeditor5-build-inline' } );

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 1 );
			expect( pathsCollection.matched.has( '/tmp' ) ).to.equal( true );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 5 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-core' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-engine' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-build-inline' ) ).to.equal( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-build-classic' ) ).to.equal( true );
		} );

		it( 'allows returning the main repository only (skipMainRepository=false)', () => {
			const options = {
				cwd: '/tmp',
				packages: null
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 1 );
			expect( pathsCollection.matched.has( '/tmp' ) ).to.equal( true );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 0 );
		} );

		it( 'allows returning the main repository only (skipMainRepository=true)', () => {
			const options = {
				cwd: '/tmp',
				packages: null,
				skipMainRepository: true
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 0 );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 1 );
			expect( pathsCollection.skipped.has( '/tmp' ) ).to.equal( true );
		} );
	} );
} );
