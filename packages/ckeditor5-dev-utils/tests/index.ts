/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import logger from '../src/logger/index.js';
import * as packageUtils from '../src/index.js';
import * as loaders from '../src/loaders/index.js';
import * as stream from '../src/stream/index.js';
import * as styles from '../src/styles/index.js';
import * as tools from '../src/tools/index.js';

vi.mock( '../src/builds/index.js' );
vi.mock( '../src/bundler/index.js' );
vi.mock( '../src/loaders/index.js' );
vi.mock( '../src/logger/index.js' );
vi.mock( '../src/stream/index.js' );
vi.mock( '../src/styles/index.js' );
vi.mock( '../src/tools/index.js' );
vi.mock( '../src/git/index.js' );

describe( 'index.js', () => {
	describe( '#loaders', () => {
		it( 'should be a function', () => {
			expect( packageUtils.loaders ).to.equal( loaders );
		} );
	} );

	describe( '#logger', () => {
		it( 'should be a function', () => {
			expect( packageUtils.logger ).to.equal( logger );
		} );
	} );

	describe( '#stream', () => {
		it( 'should be a function', () => {
			expect( packageUtils.stream ).to.equal( stream );
		} );
	} );

	describe( '#styles', () => {
		it( 'should be a function', () => {
			expect( packageUtils.styles ).to.equal( styles );
		} );
	} );

	describe( '#tools', () => {
		it( 'should be a function', () => {
			expect( packageUtils.tools ).to.equal( tools );
		} );
	} );
} );
