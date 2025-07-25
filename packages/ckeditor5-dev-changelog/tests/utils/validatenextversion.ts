/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { validateNextVersion } from '../../src/utils/validatenextversion.js';
import { InternalError } from '../../src/utils/internalerror.js';

describe( 'validateNextVersion()', () => {
	it( 'should not throw error when current version is a stable release', () => {
		expect( () => {
			validateNextVersion( '1.0.0', 'internal' );
		} ).not.toThrow();
	} );

	it( 'should throw InternalError with correct message when current version is a prerelease', () => {
		expect( () => {
			validateNextVersion( '1.0.0-alpha.0', 'internal' );
		} ).toThrow( InternalError );

		expect( () => {
			validateNextVersion( '1.0.0-alpha.0', 'internal' );
		} ).toThrow( 'Internal release may only be performed on latest release, and current version is a pre-release: 1.0.0-alpha.0.' );
	} );

	it( 'should not throw error when nextVersion is a valid stable semver', () => {
		expect( () => {
			validateNextVersion( '1.0.0-alpha.0', '1.0.0' );
		} ).not.toThrow();
	} );

	it( 'should not throw error when nextVersion is a prerelease version', () => {
		expect( () => {
			validateNextVersion( '1.0.0', '1.0.0-alpha.0' );
		} ).not.toThrow();
	} );

	it( 'should not throw error when nextVersion is undefined', () => {
		expect( () => {
			validateNextVersion( '1.0.0-beta.1', undefined );
		} ).not.toThrow();
	} );

	it( 'should not throw error when nextVersion is a stable release', () => {
		expect( () => {
			validateNextVersion( '1.0.0', '2.0.0' );
		} ).not.toThrow();
	} );

	it( 'should throw InternalError with correct message when nextVersion is empty string', () => {
		expect( () => {
			validateNextVersion( '1.0.0', '' );
		} ).toThrow( 'Next version cannot be an empty string.' );
	} );
} );
