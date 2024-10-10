/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import getPackageContexts from '../../lib/utils/getpackagecontexts.js';

vi.mock( 'fs-extra' );

describe( 'getPackageContexts()', () => {
	let defaultOptions;

	beforeEach( () => {
		defaultOptions = {
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core'
		};

		vi.mocked( fs.existsSync ).mockImplementation( path => {
			if ( path === 'packages/ckeditor5-foo/lang/contexts.json' ) {
				return true;
			}

			if ( path === 'packages/ckeditor5-core/lang/contexts.json' ) {
				return true;
			}

			return false;
		} );

		vi.mocked( fs.readJsonSync ).mockImplementation( path => {
			if ( path === 'packages/ckeditor5-foo/lang/contexts.json' ) {
				return {
					'Text ID in "ckeditor5-foo"': 'Example context for text in "ckeditor5-foo".'
				};
			}

			if ( path === 'packages/ckeditor5-core/lang/contexts.json' ) {
				return {
					'Text ID in "ckeditor5-core"': 'Example context for text in "ckeditor5-core".'
				};
			}

			throw new Error( `ENOENT: no such file or directory, open ${ path }` );
		} );
	} );

	it( 'should be a function', () => {
		expect( getPackageContexts ).toBeInstanceOf( Function );
	} );

	it( 'should read existing context files from packages (including core package)', () => {
		getPackageContexts( defaultOptions );

		expect( defaultOptions.packagePaths ).toEqual( expect.arrayContaining( [ 'packages/ckeditor5-core' ] ) );

		expect( fs.existsSync ).toHaveBeenCalledTimes( 2 );
		expect( fs.existsSync ).toHaveBeenCalledWith( 'packages/ckeditor5-foo/lang/contexts.json' );
		expect( fs.existsSync ).toHaveBeenCalledWith( 'packages/ckeditor5-core/lang/contexts.json' );

		expect( fs.readJsonSync ).toHaveBeenCalledTimes( 2 );
		expect( fs.readJsonSync ).toHaveBeenCalledWith( 'packages/ckeditor5-foo/lang/contexts.json' );
		expect( fs.readJsonSync ).toHaveBeenCalledWith( 'packages/ckeditor5-core/lang/contexts.json' );
	} );

	it( 'should not duplicate core package if it is already included in the packages', () => {
		defaultOptions.packagePaths.push( 'packages/ckeditor5-core' );

		getPackageContexts( defaultOptions );

		expect( defaultOptions.packagePaths ).toHaveLength( 2 );
	} );

	it( 'should return package contexts', () => {
		const result = getPackageContexts( defaultOptions );

		expect( result ).toBeInstanceOf( Array );
		expect( result ).toHaveLength( 2 );
		expect( result ).toEqual( expect.arrayContaining( [
			{
				contextContent: {
					'Text ID in "ckeditor5-foo"': 'Example context for text in "ckeditor5-foo".'
				},
				contextFilePath: 'packages/ckeditor5-foo/lang/contexts.json',
				packagePath: 'packages/ckeditor5-foo'
			}
		] ) );
		expect( result ).toEqual( expect.arrayContaining( [
			{
				contextContent: {
					'Text ID in "ckeditor5-core"': 'Example context for text in "ckeditor5-core".'
				},
				contextFilePath: 'packages/ckeditor5-core/lang/contexts.json',
				packagePath: 'packages/ckeditor5-core'
			}
		] ) );
	} );

	it( 'should return empty context if package does not have context file', () => {
		defaultOptions.packagePaths.push( 'packages/ckeditor5-bar' );

		const result = getPackageContexts( defaultOptions );

		expect( result ).toBeInstanceOf( Array );
		expect( result ).toHaveLength( 3 );
		expect( result ).toEqual( expect.arrayContaining( [
			{
				contextContent: {},
				contextFilePath: 'packages/ckeditor5-bar/lang/contexts.json',
				packagePath: 'packages/ckeditor5-bar'
			}
		] ) );
	} );
} );
