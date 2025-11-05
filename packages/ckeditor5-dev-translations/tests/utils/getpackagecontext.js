/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import getPackageContext from '../../lib/utils/getpackagecontext.js';

vi.mock( 'fs' );

describe( 'getPackageContext()', () => {
	let defaultOptions;

	beforeEach( () => {
		defaultOptions = {
			packagePath: '/absolute/path/to/packages/ckeditor5-foo'
		};

		vi.mocked( fs.readFileSync ).mockImplementation( path => {
			if ( path === '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json' ) {
				return JSON.stringify( {
					id1: 'Context for message id1 from "ckeditor5-foo".'
				} );
			}

			return null;
		} );
	} );

	it( 'should be a function', () => {
		expect( getPackageContext ).toBeInstanceOf( Function );
	} );

	it( 'should read context file from package', () => {
		getPackageContext( defaultOptions );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json', 'utf-8' );
	} );

	it( 'should return package contexts', () => {
		const result = getPackageContext( defaultOptions );

		expect( result ).toEqual( expect.objectContaining( {
			contextContent: {
				id1: 'Context for message id1 from "ckeditor5-foo".'
			},
			contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
			packagePath: '/absolute/path/to/packages/ckeditor5-foo'
		} ) );
	} );

	it( 'should return empty context if package does not have context file', () => {
		defaultOptions.packagePath = '/absolute/path/to/packages/ckeditor5-bar';

		const result = getPackageContext( defaultOptions );

		expect( result ).toEqual( expect.objectContaining( {
			contextContent: {},
			contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
			packagePath: '/absolute/path/to/packages/ckeditor5-bar'
		} ) );
	} );
} );
