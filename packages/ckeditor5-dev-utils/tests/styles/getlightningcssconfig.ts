/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getLightningCssConfig from '../../src/styles/getlightningcssconfig.js';

describe( 'getLightningCssConfig()', () => {
	it( 'returns Lightning CSS options', () => {
		expect( getLightningCssConfig() ).toEqual( {
			sourceMap: false,
			minify: false,
			include: expect.any( Number )
		} );
	} );

	it( 'supports #sourceMap option', () => {
		expect( getLightningCssConfig( { sourceMap: true } ).sourceMap )
			.to.be.true;
	} );

	it( 'supports #minify option', () => {
		expect( getLightningCssConfig( { minify: true } ).minify )
			.to.be.true;
	} );
} );
