/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { upgradeDependency } from '../src/upgrader.ts';

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

vi.mock( 'node:child_process', () => ( {
	spawnSync: vi.fn( () => ( { status: 0 } ) )
} ) );

describe( 'upgradeDependency()', () => {
	it( 'passes --latest when latest option is enabled', async () => {
		upgradeDependency( [ 'vitest' ], { latest: true } );

		expect( spawnSync ).toHaveBeenCalledWith( command, [
			'update',
			'--depth',
			'Infinity',
			'--recursive',
			'--latest',
			'vitest'
		], {
			cwd: process.cwd(),
			stdio: 'pipe',
			encoding: 'utf8'
		} );
	} );

	it( 'passes --depth when depth option is provided', async () => {
		upgradeDependency( [ 'vitest' ], { depth: 0 } );

		expect( spawnSync ).toHaveBeenCalledWith( command, [
			'update',
			'--depth',
			'0',
			'--recursive',
			'vitest'
		], {
			cwd: process.cwd(),
			stdio: 'pipe',
			encoding: 'utf8'
		} );
	} );

	it( 'omits --recursive when recursive option is disabled', async () => {
		upgradeDependency( [ 'vitest' ], { recursive: false } );

		expect( spawnSync ).toHaveBeenCalledWith( command, [
			'update',
			'--depth',
			'Infinity',
			'vitest'
		], {
			cwd: process.cwd(),
			stdio: 'pipe',
			encoding: 'utf8'
		} );
	} );

	it( 'inherits stdio when verbose option is enabled', async () => {
		upgradeDependency( [ 'vitest' ], { verbose: true } );

		expect( spawnSync ).toHaveBeenCalledWith( command, [
			'update',
			'--depth',
			'Infinity',
			'--recursive',
			'vitest'
		], {
			cwd: process.cwd(),
			stdio: 'inherit',
			encoding: 'utf8'
		} );
	} );

	it( 'falls back to 1 when status is missing', async () => {
		vi.mocked( spawnSync ).mockReturnValueOnce( { status: null } );

		expect( upgradeDependency( [ 'vitest' ] ) ).toEqual( 1 );
	} );
} );
