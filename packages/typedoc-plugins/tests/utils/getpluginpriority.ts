/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { getPluginPriority } from '../../src/utils/getpluginpriority.js';

describe( 'getPluginPriority', () => {
	it( 'should return 0 for restore-program-after-conversion', () => {
		expect( getPluginPriority( 'typeDocRestoreProgramAfterConversion' ) ).toBe( 0 );
	} );

	it( 'should return -1 for module-fixer', () => {
		expect( getPluginPriority( 'typeDocModuleFixer' ) ).toBe( -1 );
	} );

	it( 'should return -5 for validators', () => {
		expect( getPluginPriority( 'validators' ) ).toBe( -5 );
	} );

	it( 'should return -6 for an unknown plugin', () => {
		expect( getPluginPriority( 'unknown-plugin' ) ).toBe( -6 );
	} );
} );
