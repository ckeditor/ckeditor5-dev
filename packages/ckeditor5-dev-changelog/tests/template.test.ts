/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import * as template from '../src/template.js';

/**
 * Mocks arguments passed via the CLI.
 */
function mockCliArgs( ...args: Array<string> ) {
	vi.stubGlobal( 'process', {
		...process,
		argv: [ 'node', 'cli-command-name', ...args ]
	} );
}

describe( 'getCliArguments', () => {
	it( 'does not return anything if no CLI arguments were passed', () => {
		mockCliArgs();

		expect( template.getCliArguments() ).toEqual( {} );
	} );

	it( 'handles `--cwd` argument', () => {
		mockCliArgs( '--cwd=./cwd' );

		expect( template.getCliArguments() ).toEqual( { cwd: './cwd' } );
	} );

	it( 'handles `--directory` argument', () => {
		mockCliArgs( '--directory=./output' );

		expect( template.getCliArguments() ).toEqual( { directory: './output' } );
	} );

	it( 'handles `--template` argument', () => {
		mockCliArgs( '--template=./input.md' );

		expect( template.getCliArguments() ).toEqual( { template: './input.md' } );
	} );

	it( 'throws an error when unknown argument is used', () => {
		mockCliArgs( '--invalid=./path' );

		expect( () => template.getCliArguments() ).throws( 'Unknown option \'--invalid\'' );
	} );
} );

