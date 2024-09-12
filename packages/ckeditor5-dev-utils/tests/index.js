/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import logger from '../lib/logger/index.js';
import * as packageUtils from '../lib/index.js';
import * as bundler from '../lib/bundler/index.js';
import * as loaders from '../lib/loaders/index.js';
import * as builds from '../lib/builds/index.js';
import * as stream from '../lib/stream/index.js';
import * as styles from '../lib/styles/index.js';
import * as tools from '../lib/tools/index.js';

vi.mock( '../lib/builds/index.js' );
vi.mock( '../lib/bundler/index.js' );
vi.mock( '../lib/loaders/index.js' );
vi.mock( '../lib/logger/index.js' );
vi.mock( '../lib/stream/index.js' );
vi.mock( '../lib/styles/index.js' );
vi.mock( '../lib/tools/index.js' );

describe( 'index.js', () => {
	describe( '#builds', () => {
		it( 'should be a function', () => {
			expect( packageUtils.builds ).to.equal( builds );
		} );
	} );

	describe( '#bundler', () => {
		it( 'should be a function', () => {
			expect( packageUtils.bundler ).to.equal( bundler );
		} );
	} );

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
