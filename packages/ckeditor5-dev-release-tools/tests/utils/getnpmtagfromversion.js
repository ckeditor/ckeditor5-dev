/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';

import getNpmTagFromVersion from '../../lib/utils/getnpmtagfromversion.js';

describe( 'getNpmTagFromVersion()', () => {
	it( 'should return "latest" when processing a X.Y.Z version', () => {
		expect( getNpmTagFromVersion( '1.0.0' ) ).to.equal( 'latest' );
		expect( getNpmTagFromVersion( '2.1.0' ) ).to.equal( 'latest' );
		expect( getNpmTagFromVersion( '3.2.1' ) ).to.equal( 'latest' );
	} );

	it( 'should return "alpha" when processing a X.Y.Z-alpha.X version', () => {
		expect( getNpmTagFromVersion( '1.0.0-alpha.0' ) ).to.equal( 'alpha' );
		expect( getNpmTagFromVersion( '2.1.0-alpha.0' ) ).to.equal( 'alpha' );
		expect( getNpmTagFromVersion( '3.2.1-alpha.0' ) ).to.equal( 'alpha' );
	} );

	it( 'should return "nightly" when processing a 0.0.0-nightly-YYYYMMDD.X version', () => {
		expect( getNpmTagFromVersion( '0.0.0-nightly-20230517.0' ) ).to.equal( 'nightly' );
	} );

	it( 'should return "nightly-next" when processing a 0.0.0-nightly-next-YYYYMMDD.X version', () => {
		expect( getNpmTagFromVersion( '0.0.0-nightly-next-20230517.0' ) ).to.equal( 'nightly-next' );
	} );

	it( 'should return "internal" when processing a 0.0.0-internal-YYYYMMDD.X version', () => {
		expect( getNpmTagFromVersion( '0.0.0-internal-20230517.0' ) ).to.equal( 'internal' );
	} );
} );
