/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { logInfo } from '../../src/utils/loginfo.js';

describe( 'logInfo', () => {
	it( 'logs text without indentation by default', () => {
		const consoleSpy = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

		logInfo( 'Hello, world!' );

		expect( consoleSpy ).toHaveBeenCalledWith( 'Hello, world!' );
		consoleSpy.mockRestore();
	} );

	it( 'logs text with the specified indentation', () => {
		const consoleSpy = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

		logInfo( 'Indented text', { indent: 4 } );

		expect( consoleSpy ).toHaveBeenCalledWith( '    Indented text' );
		consoleSpy.mockRestore();
	} );

	it( 'logs empty string when text is empty', () => {
		const consoleSpy = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

		logInfo( '' );

		expect( consoleSpy ).toHaveBeenCalledWith( '' );
		consoleSpy.mockRestore();
	} );

	it( 'logs text with zero indentation when indent is explicitly set to 0', () => {
		const consoleSpy = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

		logInfo( 'No indent', { indent: 0 } );

		expect( consoleSpy ).toHaveBeenCalledWith( 'No indent' );
		consoleSpy.mockRestore();
	} );
} );
