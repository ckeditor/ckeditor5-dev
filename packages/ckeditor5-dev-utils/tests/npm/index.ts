/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as npm from '../../src/npm/index.js';
import { manifest, packument } from '../../src/npm/pacotecacheless.js';
import checkVersionAvailability from '../../src/npm/checkversionavailability.js';

vi.mock( '../../src/npm/findpathstopackages.js' );
vi.mock( '../../src/npm/checkVersionAvailability.js' );

describe( 'npm/index.js', () => {
	describe( 'checkVersionAvailability()', () => {
		it( 'should be a function', () => {
			expect( npm.checkVersionAvailability ).to.be.a( 'function' );
			expect( npm.checkVersionAvailability ).toEqual( checkVersionAvailability );
		} );
	} );

	describe( 'manifest()', () => {
		it( 'should be a function', () => {
			expect( npm.manifest ).to.be.a( 'function' );
			expect( npm.manifest ).toEqual( manifest );
		} );
	} );

	describe( 'packument()', () => {
		it( 'should be a function', () => {
			expect( npm.packument ).to.be.a( 'function' );
			expect( npm.packument ).toEqual( packument );
		} );
	} );
} );
