/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as tasks from '../../lib/builds/index.js';
import getDllPluginWebpackConfig from '../../lib/builds/getdllpluginwebpackconfig.js';

vi.mock( '../../lib/builds/getdllpluginwebpackconfig.js' );

describe( 'builds', () => {
	describe( 'getDllPluginWebpackConfig()', () => {
		it( 'should be a function', () => {
			expect( tasks.getDllPluginWebpackConfig ).to.be.a( 'function' );
			expect( tasks.getDllPluginWebpackConfig ).toEqual( getDllPluginWebpackConfig );
		} );
	} );
} );
