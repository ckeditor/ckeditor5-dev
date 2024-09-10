/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import getPackageJson from '../../lib/utils/getpackagejson.js';
import getPackagesPaths from '../../lib/utils/getpackagespaths.js';

vi.mock( 'path', () => ( {
	default: {
		join: vi.fn( ( ...chunks ) => chunks.join( '/' ) )
	}
} ) );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../lib/utils/getpackagejson.js' );

describe( 'dev-release-tools/utils', () => {
	describe( 'getPackagesPaths()', () => {
		it( 'returns all found packages', () => {
			vi.mocked( tools.getDirectories ).mockReturnValue( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils'
			] );

			vi.mocked( getPackageJson )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-core' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-engine' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-utils' } );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [],
				skipMainRepository: true
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).toBeInstanceOf( Set );
			expect( pathsCollection.matched.size ).toEqual( 3 );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-core' ) ).toEqual( true );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-engine' ) ).toEqual( true );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-utils' ) ).toEqual( true );

			expect( pathsCollection.skipped ).toBeInstanceOf( Set );
			expect( pathsCollection.skipped.size ).toEqual( 1 );
			expect( pathsCollection.skipped.has( '/tmp' ) ).toEqual( true );
		} );

		it( 'allows ignoring specified packages (specified as array)', () => {
			vi.mocked( tools.getDirectories ).mockReturnValue( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils'
			] );

			vi.mocked( getPackageJson )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-core' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-engine' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-utils' } );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [
					'@ckeditor/ckeditor5-utils'
				],
				skipMainRepository: true
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).toBeInstanceOf( Set );
			expect( pathsCollection.matched.size ).toEqual( 2 );

			expect( pathsCollection.skipped ).toBeInstanceOf( Set );
			expect( pathsCollection.skipped.size ).toEqual( 2 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp' ) ).toEqual( true );
		} );

		it( 'allows ignoring specified packages (specified as string)', () => {
			vi.mocked( tools.getDirectories ).mockReturnValue( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils'
			] );

			vi.mocked( getPackageJson )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-core' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-engine' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-utils' } );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: '@ckeditor/ckeditor5-u*',
				skipMainRepository: true
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).toBeInstanceOf( Set );
			expect( pathsCollection.matched.size ).toEqual( 2 );

			expect( pathsCollection.skipped ).toBeInstanceOf( Set );
			expect( pathsCollection.skipped.size ).toEqual( 2 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp' ) ).toEqual( true );
		} );

		it( 'allows restricting the scope for packages', () => {
			vi.mocked( tools.getDirectories ).mockReturnValue( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils',
				'ckeditor5-build-classic',
				'ckeditor5-build-inline'
			] );

			vi.mocked( getPackageJson )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-core' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-engine' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-utils' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-build-classic' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-build-inline' } );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				scope: '@ckeditor/ckeditor5-build-*',
				skipPackages: [],
				skipMainRepository: true
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).toBeInstanceOf( Set );
			expect( pathsCollection.matched.size ).toEqual( 2 );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-build-classic' ) ).toEqual( true );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-build-inline' ) ).toEqual( true );

			expect( pathsCollection.skipped ).toBeInstanceOf( Set );
			expect( pathsCollection.skipped.size ).toEqual( 4 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-core' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-engine' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp' ) ).toEqual( true );
		} );

		it( 'allows restricting the scope for packages and works fine with "skipPackages" option', () => {
			vi.mocked( tools.getDirectories ).mockReturnValue( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils',
				'ckeditor5-build-classic',
				'ckeditor5-build-inline'
			] );

			vi.mocked( getPackageJson )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-core' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-engine' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-utils' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-build-classic' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-build-inline' } );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				scope: '@ckeditor/ckeditor5-build-*',
				skipPackages: [
					'@ckeditor/ckeditor5-build-inline'
				],
				skipMainRepository: true
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).toBeInstanceOf( Set );
			expect( pathsCollection.matched.size ).toEqual( 1 );
			expect( pathsCollection.matched.has( '/tmp/packages/ckeditor5-build-classic' ) ).toEqual( true );

			expect( pathsCollection.skipped ).toBeInstanceOf( Set );
			expect( pathsCollection.skipped.size ).toEqual( 5 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-core' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-engine' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-build-inline' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp' ) ).toEqual( true );
		} );

		it( 'allows returning the main repository', () => {
			vi.mocked( tools.getDirectories ).mockReturnValue( [
				'ckeditor5-core',
				'ckeditor5-engine',
				'ckeditor5-utils',
				'ckeditor5-build-classic',
				'ckeditor5-build-inline'
			] );

			vi.mocked( getPackageJson )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-core' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-engine' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-utils' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-build-classic' } )
				.mockReturnValueOnce( { name: '@ckeditor/ckeditor5-build-inline' } );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [
					'@ckeditor/ckeditor5-*'
				],
				skipMainRepository: false
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).toBeInstanceOf( Set );
			expect( pathsCollection.matched.size ).toEqual( 1 );
			expect( pathsCollection.matched.has( '/tmp' ) ).toEqual( true );

			expect( pathsCollection.skipped ).toBeInstanceOf( Set );
			expect( pathsCollection.skipped.size ).toEqual( 5 );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-core' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-engine' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-utils' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-build-inline' ) ).toEqual( true );
			expect( pathsCollection.skipped.has( '/tmp/packages/ckeditor5-build-classic' ) ).toEqual( true );
		} );

		it( 'allows returning the main repository only (skipMainRepository=false)', () => {
			const options = {
				cwd: '/tmp',
				packages: null
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).toBeInstanceOf( Set );
			expect( pathsCollection.matched.size ).toEqual( 1 );
			expect( pathsCollection.matched.has( '/tmp' ) ).toEqual( true );

			expect( pathsCollection.skipped ).toBeInstanceOf( Set );
			expect( pathsCollection.skipped.size ).toEqual( 0 );
		} );

		it( 'allows returning the main repository only (skipMainRepository=true)', () => {
			const options = {
				cwd: '/tmp',
				packages: null,
				skipMainRepository: true
			};

			const pathsCollection = getPackagesPaths( options );

			expect( pathsCollection.matched ).toBeInstanceOf( Set );
			expect( pathsCollection.matched.size ).toEqual( 0 );

			expect( pathsCollection.skipped ).toBeInstanceOf( Set );
			expect( pathsCollection.skipped.size ).toEqual( 1 );
			expect( pathsCollection.skipped.has( '/tmp' ) ).toEqual( true );
		} );
	} );
} );
