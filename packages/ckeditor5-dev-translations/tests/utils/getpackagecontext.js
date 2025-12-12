/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import getPackageContext from '../../lib/utils/getpackagecontext.js';

vi.mock( 'fs' );

const PACKAGE_PATH = '/absolute/path/to/packages/ckeditor5-foo';
const CONTEXTS_PATH = `${ PACKAGE_PATH }/lang/contexts.json`;

describe( 'getPackageContext()', () => {
	beforeEach( () => {
		vi.mocked( fs.existsSync ).mockImplementation( path => {
			return path === CONTEXTS_PATH;
		} );

		vi.mocked( fs.readFileSync ).mockImplementation( path => {
			if ( path === CONTEXTS_PATH ) {
				return JSON.stringify( {
					id1: 'Context for message id1 from "ckeditor5-foo".'
				} );
			}

			throw new Error( 'File does not exist' );
		} );
	} );

	it( 'should be a function', () => {
		expect( getPackageContext ).toBeInstanceOf( Function );
	} );

	it( 'should read context file from package', () => {
		getPackageContext( {
			packagePath: PACKAGE_PATH
		} );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.readFileSync ).toHaveBeenCalledWith( CONTEXTS_PATH, 'utf-8' );
	} );

	it( 'should return package contexts', () => {
		const result = getPackageContext( {
			packagePath: PACKAGE_PATH
		} );

		expect( result ).toEqual( expect.objectContaining( {
			contextContent: {
				id1: 'Context for message id1 from "ckeditor5-foo".'
			},
			contextFilePath: CONTEXTS_PATH,
			packagePath: PACKAGE_PATH
		} ) );
	} );

	it( 'should return empty context if package does not have context file', () => {
		const result = getPackageContext( {
			packagePath: '/absolute/path/to/packages/ckeditor5-bar'
		} );

		expect( result ).toEqual( expect.objectContaining( {
			contextContent: {},
			contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
			packagePath: '/absolute/path/to/packages/ckeditor5-bar'
		} ) );
	} );
} );
