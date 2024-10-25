/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import pacote from 'pacote';
import semver from 'semver';

import isVersionPublishableForTag from '../../lib/utils/isversionpublishablefortag.js';

vi.mock( 'pacote' );
vi.mock( 'semver' );

describe( 'isVersionPublishableForTag()', () => {
	it( 'should return false if given version is not available', async () => {
		vi.mocked( semver.lte ).mockReturnValue( true );
		vi.mocked( pacote.manifest ).mockResolvedValue( ( {
			version: '1.0.0'
		} ) );

		const result = await isVersionPublishableForTag( 'package-name', '1.0.0', 'latest' );

		expect( result ).to.equal( false );
		expect( semver.lte ).toHaveBeenCalledExactlyOnceWith( '1.0.0', '1.0.0' );
		expect( pacote.manifest ).toHaveBeenCalledExactlyOnceWith( 'package-name@latest', { cache: null } );
	} );

	it( 'should return false if given version is not higher than the latest published', async () => {
		vi.mocked( semver.lte ).mockReturnValue( true );

		vi.mocked( pacote.manifest ).mockResolvedValue( ( {
			version: '1.0.1'
		} ) );

		const result = await isVersionPublishableForTag( 'package-name', '1.0.0', 'latest' );

		expect( result ).to.equal( false );
		expect( semver.lte ).toHaveBeenCalledExactlyOnceWith( '1.0.0', '1.0.1' );
	} );

	it( 'should return true if given npm tag is not published yet', async () => {
		vi.mocked( pacote.manifest ).mockRejectedValue( 'E404' );

		const result = await isVersionPublishableForTag( 'package-name', '1.0.0', 'alpha' );

		expect( result ).to.equal( true );
		expect( semver.lte ).not.toHaveBeenCalled();
		expect( pacote.manifest ).toHaveBeenCalledExactlyOnceWith( 'package-name@alpha', expect.any( Object ) );
	} );
} );
