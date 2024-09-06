/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import { members } from '../../lib/data/index';

describe( 'lib/data/members', () => {
	it( 'should be an object', () => {
		expect( members ).to.be.a( 'object' );
	} );

	// https://github.com/ckeditor/ckeditor5/issues/14876.
	it( 'should not contain GitHub names with spaces', () => {
		const spaceMembers = Object.keys( members ).filter( name => name.includes( ' ' ) );

		expect( spaceMembers ).to.deep.equal( [] );
	} );
} );
