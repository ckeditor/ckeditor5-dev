/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.ts';
import { upgradeDependency } from '../src/upgrader.js';

vi.mock( '../src/upgrader.js', () => ( {
	upgradeDependency: vi.fn( () => 0 )
} ) );

describe( 'runCli()', () => {
	let originalArgv;

	beforeEach( () => {
		originalArgv = process.argv;
	} );

	afterEach( () => {
		process.argv = originalArgv;
	} );

	it( 'runs upgradeDependency with defaults when called without optional flags', async () => {
		process.argv = [ 'node', 'ckeditor5-dev-dependency-upgrader', 'vitest' ];

		expect( await runCli() ).toEqual( 0 );

		expect( upgradeDependency ).toHaveBeenCalledWith( [ 'vitest' ], {
			latest: false,
			depth: 'Infinity',
			recursive: true,
			verbose: true
		} );
	} );

	it( 'passes --latest when latest flag is provided', async () => {
		process.argv = [ 'node', 'ckeditor5-dev-dependency-upgrader', 'vitest', '--latest' ];

		await runCli();

		expect( upgradeDependency ).toHaveBeenCalledWith( [ 'vitest' ], {
			latest: true,
			depth: 'Infinity',
			recursive: true,
			verbose: true
		} );
	} );

	it( 'sets --depth when depth option is provided', async () => {
		process.argv = [ 'node', 'ckeditor5-dev-dependency-upgrader', 'vitest', '--depth', '2' ];

		await runCli();

		expect( upgradeDependency ).toHaveBeenCalledWith( [ 'vitest' ], {
			latest: false,
			depth: 2,
			recursive: true,
			verbose: true
		} );
	} );

	it( 'omits --recursive when recursive flag is disabled', async () => {
		process.argv = [ 'node', 'ckeditor5-dev-dependency-upgrader', 'vitest', '--no-recursive' ];

		await runCli();

		expect( upgradeDependency ).toHaveBeenCalledWith( [ 'vitest' ], {
			latest: false,
			depth: 'Infinity',
			recursive: false,
			verbose: true
		} );
	} );

	it( 'trims and filters package positionals', async () => {
		vi.mocked( upgradeDependency ).mockReturnValueOnce( 5 );

		process.argv = [
			'node',
			'ckeditor5-dev-dependency-upgrader',
			'  @ckeditor/foo  ',
			'',
			' @ckeditor/bar '
		];

		expect( await runCli() ).toEqual( 5 );

		expect( upgradeDependency ).toHaveBeenCalledWith( [ '@ckeditor/foo', '@ckeditor/bar' ], {
			latest: false,
			depth: 'Infinity',
			recursive: true,
			verbose: true
		} );
	} );
} );
