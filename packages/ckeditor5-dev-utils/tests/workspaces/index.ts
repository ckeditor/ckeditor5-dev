/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as workspaces from '../../src/workspaces/index.js';
import findPathsToPackages from '../../src/workspaces/findpathstopackages.js';
import getPackageJson from '../../src/workspaces/getpackagejson.js';
import getRepositoryUrl from '../../src/workspaces/getrepositoryurl.js';

vi.mock( '../../src/workspaces/findpathstopackages.js' );

describe( 'workspaces/index.js', () => {
	describe( 'findPathsToPackages()', () => {
		it( 'should be a function', () => {
			expect( workspaces.findPathsToPackages ).to.be.a( 'function' );
			expect( workspaces.findPathsToPackages ).toEqual( findPathsToPackages );
		} );
	} );
	describe( 'getPackageJson()', () => {
		it( 'should be a function', () => {
			expect( workspaces.getPackageJson ).to.be.a( 'function' );
			expect( workspaces.getPackageJson ).toEqual( getPackageJson );
		} );
	} );
	describe( 'getRepositoryUrl()', () => {
		it( 'should be a function', () => {
			expect( workspaces.getRepositoryUrl ).to.be.a( 'function' );
			expect( workspaces.getRepositoryUrl ).toEqual( getRepositoryUrl );
		} );
	} );
} );
