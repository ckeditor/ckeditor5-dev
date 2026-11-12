/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import { getWatchWorkaroundConfig } from '../../src/manual-test-plugin/watch-workaround.js';

describe( 'getWatchWorkaroundConfig()', () => {
	it( 'excludes dependency and repository directories from the dev server watcher', () => {
		expect( getWatchWorkaroundConfig( {} ) ).to.deep.equal( {
			server: {
				watch: {
					exclude: [ '**/node_modules/**', '**/.git/**' ]
				}
			}
		} );
	} );

	it( 'keeps the configured server options', () => {
		expect( getWatchWorkaroundConfig( { server: { port: 8125, watch: { usePolling: true } } } ) ).to.deep.equal( {
			server: {
				watch: {
					exclude: [ '**/node_modules/**', '**/.git/**' ]
				}
			}
		} );
	} );

	it( 'does not enable a disabled watcher', () => {
		expect( getWatchWorkaroundConfig( { server: { watch: null } } ) ).to.deep.equal( {} );
	} );
} );
