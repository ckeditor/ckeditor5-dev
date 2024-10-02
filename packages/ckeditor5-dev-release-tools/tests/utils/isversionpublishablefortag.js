/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import semver from 'semver';
import shellEscape from 'shell-escape';

import isVersionPublishableForTag from '../../lib/utils/isversionpublishablefortag.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'semver' );
vi.mock( 'shell-escape' );

describe( 'isVersionPublishableForTag()', () => {
	beforeEach( () => {
		vi.mocked( shellEscape ).mockImplementation( v => v[ 0 ] );
	} );

	it( 'should return false if given version is not available', async () => {
		vi.mocked( semver.lte ).mockReturnValue( true );
		vi.mocked( tools.shExec ).mockResolvedValue( '1.0.0\n' );

		const result = await isVersionPublishableForTag( 'package-name', '1.0.0', 'latest' );

		expect( result ).to.equal( false );
		expect( semver.lte ).toHaveBeenCalledTimes( 1 );
		expect( semver.lte ).toHaveBeenCalledWith( '1.0.0', '1.0.0' );
		expect( tools.shExec ).toHaveBeenCalledTimes( 1 );
		expect( tools.shExec ).toHaveBeenCalledWith( 'npm view package-name@latest version --silent', expect.anything() );
	} );

	it( 'should return true if given npm tag is not published yet', async () => {
		vi.mocked( tools.shExec ).mockRejectedValue( 'E404' );

		const result = await isVersionPublishableForTag( 'package-name', '1.0.0', 'alpha' );

		expect( result ).to.equal( true );
		expect( semver.lte ).not.toHaveBeenCalled();
		expect( tools.shExec ).toHaveBeenCalledTimes( 1 );
		expect( tools.shExec ).toHaveBeenCalledWith( 'npm view package-name@alpha version --silent', expect.anything() );
	} );
} );
