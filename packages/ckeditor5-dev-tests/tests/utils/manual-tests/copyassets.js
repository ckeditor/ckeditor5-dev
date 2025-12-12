/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import copyAssets from '../../../lib/utils/manual-tests/copyassets.js';

vi.mock( 'fs' );

describe( 'copyAssets()', () => {
	let mkdirSync, copyFileSync;

	const ASSETS = [
		'togglesidebar.js',
		'attachinspector.js',
		'websocket.js',
		'globallicensekey.js'
	];

	beforeEach( () => {
		mkdirSync = vi.fn();
		copyFileSync = vi.fn();

		vi.mocked( fs.mkdirSync ).mockImplementation( mkdirSync );
		vi.mocked( fs.copyFileSync ).mockImplementation( copyFileSync );
	} );

	it( 'should copy all assets to the build assets directory', () => {
		const buildDir = '/build';
		copyAssets( buildDir );

		expect( mkdirSync ).toHaveBeenCalledWith( buildDir + '/assets', expect.any( Object ) );
		expect( copyFileSync ).toHaveBeenCalledTimes( ASSETS.length + 1 );

		const scriptPath = path.resolve( import.meta.dirname, '..', '..', '..', 'lib', 'utils', 'manual-tests' );

		for ( const [ index, assetPath ] of ASSETS.entries() ) {
			expect( copyFileSync ).toHaveBeenNthCalledWith(
				index + 1,
				path.resolve( scriptPath, assetPath ),
				path.resolve( buildDir, 'assets', path.basename( assetPath ) )
			);
		}
	} );
} );
