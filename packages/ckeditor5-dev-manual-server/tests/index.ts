/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import {
	ckDebugPlugin,
	manualTestsPlugin,
	preserveCssImportOrderPlugin,
	rawSvgPlugin,
	refreshPlugin,
	stringifyValues
} from '../src/index.js';

describe( 'package entry point', () => {
	it( 'exports public plugin factories and utilities', () => {
		expect( ckDebugPlugin ).to.be.a( 'function' );
		expect( manualTestsPlugin ).to.be.a( 'function' );
		expect( preserveCssImportOrderPlugin ).to.be.a( 'function' );
		expect( rawSvgPlugin ).to.be.a( 'function' );
		expect( refreshPlugin ).to.be.a( 'function' );
		expect( stringifyValues ).to.be.a( 'function' );
	} );
} );
