/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import parseArguments from '../../scripts/utils/parsearguments.js';

describe( 'scripts/utils/parsearguments', () => {
	// The release scripts (`release:prepare-packages`, `release:publish-packages`) validate and push the release branch.
	// The 61.x line is released from `master-v61`.
	it( 'uses the `master-v61` branch by default', () => {
		expect( parseArguments( [] ) ).toHaveProperty( 'branch', 'master-v61' );
	} );

	it( 'accepts a custom branch', () => {
		expect( parseArguments( [ '--branch', 'release-test' ] ) ).toHaveProperty( 'branch', 'release-test' );
	} );
} );
