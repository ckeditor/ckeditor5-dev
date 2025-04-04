/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { defaultTransformScope } from '../../src/utils/defaulttransformscope.js';
import { NPM_URL, ORGANISATION_NAMESPACE } from '../../src/constants.js';

vi.mock( '../../src/constants.js', () => ( {
	NPM_URL: 'https://www.npmjs.com/package/',
	ORGANISATION_NAMESPACE: '@org'
} ) );

describe( 'defaultTransformScope()', () => {
	it( 'should return an object with displayName and npmUrl properties', () => {
		const packageName = 'test-package';
		const result = defaultTransformScope( packageName );

		expect( result ).toEqual( {
			displayName: packageName,
			npmUrl: `${ NPM_URL }/${ ORGANISATION_NAMESPACE }/${ packageName }`
		} );
	} );

	it( 'should handle scoped package names correctly', () => {
		const packageName = '@scope/test-package';
		const result = defaultTransformScope( packageName );

		expect( result ).toEqual( {
			displayName: packageName,
			npmUrl: `${ NPM_URL }/${ ORGANISATION_NAMESPACE }/${ packageName }`
		} );
	} );

	it( 'should handle package names with special characters', () => {
		const packageName = 'test.package-name';
		const result = defaultTransformScope( packageName );

		expect( result ).toEqual( {
			displayName: packageName,
			npmUrl: `${ NPM_URL }/${ ORGANISATION_NAMESPACE }/${ packageName }`
		} );
	} );
} );
