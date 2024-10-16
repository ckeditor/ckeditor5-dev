/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import getPackageContext from '../../lib/utils/getpackagecontext.js';
import getPackageContexts from '../../lib/utils/getpackagecontexts.js';

vi.mock( '../../lib/utils/getpackagecontext.js' );

describe( 'getPackageContexts()', () => {
	let defaultOptions;

	beforeEach( () => {
		defaultOptions = {
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core'
		};

		vi.mocked( getPackageContext ).mockImplementation( ( { packagePath } ) => {
			const contextContent = {};

			if ( packagePath === 'packages/ckeditor5-foo' ) {
				contextContent.id1 = 'Context for message id1 from "ckeditor5-foo".';
			}

			if ( packagePath === 'packages/ckeditor5-core' ) {
				contextContent.id2 = 'Context for message id2 from "ckeditor5-core".';
			}

			return {
				contextContent,
				contextFilePath: packagePath + '/lang/contexts.json',
				packagePath
			};
		} );
	} );

	it( 'should be a function', () => {
		expect( getPackageContexts ).toBeInstanceOf( Function );
	} );

	it( 'should add core package if it is not included in the packages', () => {
		getPackageContexts( defaultOptions );

		expect( defaultOptions.packagePaths ).toEqual( [
			'packages/ckeditor5-foo',
			'packages/ckeditor5-core'
		] );
	} );

	it( 'should not duplicate core package if it is already included in the packages', () => {
		defaultOptions.packagePaths.push( 'packages/ckeditor5-core' );

		getPackageContexts( defaultOptions );

		expect( defaultOptions.packagePaths ).toEqual( [
			'packages/ckeditor5-foo',
			'packages/ckeditor5-core'
		] );
	} );

	it( 'should return package contexts', () => {
		const result = getPackageContexts( defaultOptions );

		expect( result ).toBeInstanceOf( Array );
		expect( result ).toHaveLength( 2 );
		expect( result ).toEqual( expect.arrayContaining( [
			{
				contextContent: {
					id1: 'Context for message id1 from "ckeditor5-foo".'
				},
				contextFilePath: 'packages/ckeditor5-foo/lang/contexts.json',
				packagePath: 'packages/ckeditor5-foo'
			}
		] ) );
		expect( result ).toEqual( expect.arrayContaining( [
			{
				contextContent: {
					id2: 'Context for message id2 from "ckeditor5-core".'
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
