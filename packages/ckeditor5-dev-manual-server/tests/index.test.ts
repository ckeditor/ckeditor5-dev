/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test } from 'vitest';
import { ckDebugPlugin, manualStaticAssetsPlugin, manualTestsPlugin, rawHtmlPlugin, refreshPlugin, stringifyValues } from '../src/index.js';

describe( 'package entry point', () => {
	test( 'exports public plugin factories and utilities', () => {
		expect( ckDebugPlugin ).to.be.a( 'function' );
		expect( manualStaticAssetsPlugin ).to.be.a( 'function' );
		expect( manualTestsPlugin ).to.be.a( 'function' );
		expect( rawHtmlPlugin ).to.be.a( 'function' );
		expect( refreshPlugin ).to.be.a( 'function' );
		expect( stringifyValues ).to.be.a( 'function' );
	} );
} );
