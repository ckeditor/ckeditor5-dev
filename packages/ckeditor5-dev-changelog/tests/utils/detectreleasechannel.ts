/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { detectReleaseChannel } from '../../src/utils/detectreleasechannel.js';
import { logInfo } from '../../src/utils/loginfo.js';

vi.mock( '../../src/utils/loginfo' );

describe( 'detectReleaseChannel()', () => {
	it( 'should detect alpha channel for prerelease', () => {
		expect( detectReleaseChannel( '1.0.0-alpha.1' ) ).toBe( 'alpha' );
		expect( detectReleaseChannel( '1.0.0-alpha.10' ) ).toBe( 'alpha' );
		expect( detectReleaseChannel( '1.0.0-alpha' ) ).toBe( 'alpha' );
	} );

	it( 'should detect beta channel for prerelease', () => {
		expect( detectReleaseChannel( '1.0.0-beta.1' ) ).toBe( 'beta' );
		expect( detectReleaseChannel( '1.0.0-beta.5' ) ).toBe( 'beta' );
		expect( detectReleaseChannel( '1.0.0-beta' ) ).toBe( 'beta' );
	} );

	it( 'should detect rc channel for prerelease', () => {
		expect( detectReleaseChannel( '1.0.0-rc.1' ) ).toBe( 'rc' );
		expect( detectReleaseChannel( '1.0.0-rc.3' ) ).toBe( 'rc' );
		expect( detectReleaseChannel( '1.0.0-rc' ) ).toBe( 'rc' );
	} );

	it( 'should detect alpha channel for prerelease promotion', () => {
		expect( detectReleaseChannel( '1.0.0-alpha.1', true ) ).toBe( 'beta' );
		expect( detectReleaseChannel( '1.0.0-alpha.10', true ) ).toBe( 'beta' );
		expect( detectReleaseChannel( '1.0.0-alpha', true ) ).toBe( 'beta' );
	} );

	it( 'should detect beta channel for prerelease promotion', () => {
		expect( detectReleaseChannel( '1.0.0-beta.1', true ) ).toBe( 'rc' );
		expect( detectReleaseChannel( '1.0.0-beta.5', true ) ).toBe( 'rc' );
		expect( detectReleaseChannel( '1.0.0-beta', true ) ).toBe( 'rc' );
	} );

	it( 'should handle unknown channel for prerelease promotion', () => {
		expect( detectReleaseChannel( '1.0.0-rc.1', true ) ).toBe( 'alpha' );
		expect( detectReleaseChannel( '1.0.0-rc.3', true ) ).toBe( 'alpha' );
		expect( detectReleaseChannel( '1.0.0-rc', true ) ).toBe( 'alpha' );

		expect( logInfo ).toBeCalledWith( 'Warning! Unknown release channel to promote from rc.' );
	} );

	it( 'should detect latest channel for stable versions', () => {
		expect( detectReleaseChannel( '1.0.0' ) ).toBe( 'latest' );
		expect( detectReleaseChannel( '1.2.3' ) ).toBe( 'latest' );
		expect( detectReleaseChannel( '10.20.30' ) ).toBe( 'latest' );
	} );
} );
