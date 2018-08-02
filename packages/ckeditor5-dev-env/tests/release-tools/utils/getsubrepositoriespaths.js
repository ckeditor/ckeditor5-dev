/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'getSubRepositoriesPaths()', () => {
		let getSubRepositoriesPaths, sandbox, getPackageJsonStub, getDirectoriesStub;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			getPackageJsonStub = sandbox.stub();
			getDirectoriesStub = sandbox.stub();

			sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

			getSubRepositoriesPaths = proxyquire( '../../../lib/release-tools/utils/getsubrepositoriespaths', {
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

			getPackageJsonStub.onCall( 0 ).returns( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils'
				}
			} );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getSubRepositoriesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 3 );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-core' ) ).to.equal( true );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-engine' ) ).to.equal( true );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 1 );
			expect( pathsCollection.skipped.has( '/tmp' ) ).to.equal( true );
		} );

		it( 'skips packages which are not specified in the package.json', () => {
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
			getPackageJsonStub.onCall( 0 ).returns( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine'
				}
			} );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getSubRepositoriesPaths( options );

			expect( pathsCollection.matched ).to.be.instanceof( Set );
			expect( pathsCollection.matched.size ).to.equal( 2 );

			expect( pathsCollection.skipped ).to.be.instanceof( Set );
			expect( pathsCollection.skipped.size ).to.equal( 2 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).to.equal( true );
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
			getPackageJsonStub.onCall( 0 ).returns( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils',
				}
			} );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getSubRepositoriesPaths( options );

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
			getPackageJsonStub.onCall( 0 ).returns( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils',
				}
			} );
			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-utils' } );

			const pathsCollection = getSubRepositoriesPaths( options );

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
				'ckeditor5-build-inline',
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				scope: '@ckeditor/ckeditor5-build-*',
				skipPackages: [],
				skipMainRepository: true
			};

			getPackageJsonStub.onCall( 0 ).returns( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils',
					'@ckeditor/ckeditor5-build-classic': 'ckeditor/ckeditor5-build-classic',
					'@ckeditor/ckeditor5-build-inline': 'ckeditor/ckeditor5-build-inline'
				}
			} );

			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-utils' } );
			getPackageJsonStub.onCall( 4 ).returns( { name: '@ckeditor/ckeditor5-build-classic' } );
			getPackageJsonStub.onCall( 5 ).returns( { name: '@ckeditor/ckeditor5-build-inline' } );

			const pathsCollection = getSubRepositoriesPaths( options );

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
				'ckeditor5-build-inline',
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

			getPackageJsonStub.onCall( 0 ).returns( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils',
					'@ckeditor/ckeditor5-build-classic': 'ckeditor/ckeditor5-build-classic',
					'@ckeditor/ckeditor5-build-inline': 'ckeditor/ckeditor5-build-inline'
				}
			} );

			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-utils' } );
			getPackageJsonStub.onCall( 4 ).returns( { name: '@ckeditor/ckeditor5-build-classic' } );
			getPackageJsonStub.onCall( 5 ).returns( { name: '@ckeditor/ckeditor5-build-inline' } );

			const pathsCollection = getSubRepositoriesPaths( options );

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
				'ckeditor5-build-inline',
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [
					'@ckeditor/ckeditor5-*'
				],
				skipMainRepository: false
			};

			getPackageJsonStub.onCall( 0 ).returns( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils',
					'@ckeditor/ckeditor5-build-classic': 'ckeditor/ckeditor5-build-classic',
					'@ckeditor/ckeditor5-build-inline': 'ckeditor/ckeditor5-build-inline'
				}
			} );

			getPackageJsonStub.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			getPackageJsonStub.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-utils' } );
			getPackageJsonStub.onCall( 4 ).returns( { name: '@ckeditor/ckeditor5-build-classic' } );
			getPackageJsonStub.onCall( 5 ).returns( { name: '@ckeditor/ckeditor5-build-inline' } );

			const pathsCollection = getSubRepositoriesPaths( options );

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
	} );
} );
