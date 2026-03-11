/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ERROR_TYPES } from '../../src/constants.js';
import type { ErrorStore } from '../../src/errors/error-store.js';
import { logErrors } from '../../src/errors/reporter.js';

describe( 'logErrors()', () => {
	beforeEach( () => {
		vi.spyOn( console, 'log' ).mockImplementation( () => {} );
		vi.spyOn( console, 'group' ).mockImplementation( () => {} );
		vi.spyOn( console, 'groupEnd' ).mockImplementation( () => {} );
	} );

	test( 'prints success message when no errors were found', () => {
		logErrors( new Map() );

		expect( console.log ).toHaveBeenCalledWith( expect.stringContaining( 'No errors have been found' ) );
		expect( console.group ).not.toHaveBeenCalled();
	} );

	test( 'prints grouped error details when errors are present', () => {
		const errors: ErrorStore = new Map( [
			[ ERROR_TYPES.CONSOLE_ERROR, new Map( [
				[ 'Unhandled exception', {
					pages: new Set( [ 'https://ckeditor.com/docs/a', 'https://ckeditor.com/docs/b' ] ),
					details: 'Error: stack trace'
				} ]
			] ) ]
		] );

		logErrors( errors );

		expect( console.group ).toHaveBeenCalled();
		expect( console.groupEnd ).toHaveBeenCalled();
		expect( console.log ).toHaveBeenCalledWith( 'Error: stack trace' );
		expect( console.log ).toHaveBeenCalledWith( expect.stringContaining( 'https://ckeditor.com/docs/a' ) );
		expect( console.log ).toHaveBeenCalledWith( expect.stringContaining( 'https://ckeditor.com/docs/b' ) );
	} );
} );
