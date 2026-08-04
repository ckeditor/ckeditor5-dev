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

	it( 'should return -3 for event-inheritance-fixer', () => {
		expect( getPluginPriority( 'typeDocEventInheritanceFixer' ) ).toBe( -3 );
	} );

	it( 'should return -4 for hierarchy-fixer', () => {
		expect( getPluginPriority( 'typeDocHierarchyFixer' ) ).toBe( -4 );
	} );

	it( 'should return -5 for purge-private-api-docs', () => {
		expect( getPluginPriority( 'typeDocPurgePrivateApiDocs' ) ).toBe( -5 );
	} );

	it( 'should return -6 for the hierarchy-fixer cleanup', () => {
		expect( getPluginPriority( 'typeDocHierarchyFixerCleanUp' ) ).toBe( -6 );
	} );

	it( 'should return -7 for validators', () => {
		expect( getPluginPriority( 'validators' ) ).toBe( -7 );
	} );

	it( 'should return -8 for an unknown plugin', () => {
		expect( getPluginPriority( 'unknown-plugin' ) ).toBe( -8 );
	} );
} );
