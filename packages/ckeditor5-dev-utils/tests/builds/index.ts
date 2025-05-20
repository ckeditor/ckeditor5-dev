/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as tasks from '../../src/builds/index.js';
import getDllPluginWebpackConfig from '../../src/builds/getdllpluginwebpackconfig.js';

vi.mock( '../../src/builds/getdllpluginwebpackconfig.js' );

describe( 'builds/index.js', () => {
	describe( 'getDllPluginWebpackConfig()', () => {
		it( 'should be a function', () => {
			expect( tasks.getDllPluginWebpackConfig ).to.be.a( 'function' );
			expect( tasks.getDllPluginWebpackConfig ).toEqual( getDllPluginWebpackConfig );
		} );
	} );
} );
