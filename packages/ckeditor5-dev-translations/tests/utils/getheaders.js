/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getNPlurals, getFormula } from 'plural-forms';
import getHeaders from '../../lib/utils/getheaders.js';

vi.mock( 'plural-forms' );

describe( 'getHeaders()', () => {
	beforeEach( () => {
		vi.mocked( getNPlurals ).mockReturnValue( 4 );
		vi.mocked( getFormula ).mockReturnValue( 'example plural formula' );
	} );

	it( 'should be a function', () => {
		expect( getHeaders ).toBeInstanceOf( Function );
	} );

	it( 'should return "Language" header', () => {
		const headers = getHeaders( 'en', 'en_GB' );

		expect( headers ).toEqual( expect.objectContaining( {
			Language: 'en_GB'
		} ) );
	} );

	it( 'should return "Plural-Forms" header', () => {
		const headers = getHeaders( 'en', 'en_GB' );

		expect( headers ).toEqual( expect.objectContaining( {
			'Plural-Forms': 'nplurals=4; plural=example plural formula;'
		} ) );

		expect( getNPlurals ).toHaveBeenCalledWith( 'en' );
		expect( getFormula ).toHaveBeenCalledWith( 'en' );
	} );

	it( 'should return "Content-Type" header', () => {
		const headers = getHeaders( 'en', 'en_GB' );

		expect( headers ).toEqual( expect.objectContaining( {
			'Content-Type': 'text/plain; charset=UTF-8'
		} ) );
	} );
} );
