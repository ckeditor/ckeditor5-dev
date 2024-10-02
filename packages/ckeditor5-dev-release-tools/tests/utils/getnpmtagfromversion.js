/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import semver from 'semver';

import getNpmTagFromVersion from '../../lib/utils/getnpmtagfromversion.js';

vi.mock( 'semver' );

describe( 'getNpmTagFromVersion()', () => {
	it( 'should return "latest" when processing a X.Y.Z version', () => {
		expect( getNpmTagFromVersion( '1.0.0' ) ).to.equal( 'latest' );
		expect( getNpmTagFromVersion( '2.1.0' ) ).to.equal( 'latest' );
		expect( getNpmTagFromVersion( '3.2.1' ) ).to.equal( 'latest' );
	} );

	it( 'should return "alpha" when processing a X.Y.Z-alpha.X version', () => {
		vi.mocked( semver.prerelease ).mockReturnValue( [ 'alpha', 0 ] );

		expect( getNpmTagFromVersion( '1.0.0-alpha.0' ) ).to.equal( 'alpha' );
		expect( getNpmTagFromVersion( '2.1.0-alpha.0' ) ).to.equal( 'alpha' );
		expect( getNpmTagFromVersion( '3.2.1-alpha.0' ) ).to.equal( 'alpha' );
	} );
} );
