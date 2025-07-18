/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { detectReleaseChannel } from '../../src/utils/detectreleasechannel.js';

describe( 'detectReleaseChannel()', () => {
	it( 'should detect alpha channel', () => {
		expect( detectReleaseChannel( '1.0.0-alpha.1' ) ).toBe( 'alpha' );
		expect( detectReleaseChannel( '1.0.0-alpha.10' ) ).toBe( 'alpha' );
		expect( detectReleaseChannel( '1.0.0-alpha' ) ).toBe( 'alpha' );
	} );

	it( 'should detect beta channel', () => {
		expect( detectReleaseChannel( '1.0.0-beta.1' ) ).toBe( 'beta' );
		expect( detectReleaseChannel( '1.0.0-beta.5' ) ).toBe( 'beta' );
		expect( detectReleaseChannel( '1.0.0-beta' ) ).toBe( 'beta' );
	} );

	it( 'should detect rc channel', () => {
		expect( detectReleaseChannel( '1.0.0-rc.1' ) ).toBe( 'rc' );
		expect( detectReleaseChannel( '1.0.0-rc.3' ) ).toBe( 'rc' );
		expect( detectReleaseChannel( '1.0.0-rc' ) ).toBe( 'rc' );
	} );

	it( 'should detect latest channel for stable versions', () => {
		expect( detectReleaseChannel( '1.0.0' ) ).toBe( 'latest' );
		expect( detectReleaseChannel( '1.2.3' ) ).toBe( 'latest' );
		expect( detectReleaseChannel( '10.20.30' ) ).toBe( 'latest' );
	} );
} );
