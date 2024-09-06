/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import testUtils from '../../utils.js';

import build from '../../../lib/buildtypedoc.js';

const stubs = vi.hoisted( () => {
	return {
		onErrorCallback: vi.fn()
	};
} );

vi.stubGlobal( 'console', {
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn()
} );

vi.mock( '../../../lib/validators/fires-validator', async () => {
	const { default: validator } = await vi.importActual( '../../../lib/validators/fires-validator' );

	return {
		default: project => validator( project, ( ...args ) => stubs.onErrorCallback( ...args ) )
	};
} );

describe( 'dev-docs/validators/fires-validator', function() {
	const FIXTURES_PATH = testUtils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = testUtils.normalizePath( FIXTURES_PATH, '**', '*.ts' );
	const TSCONFIG_PATH = testUtils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	it( 'should warn if fired event does not exist', async () => {
		await build( {
			type: 'typedoc',
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ SOURCE_FILES ],
			strict: false
		} );

		const expectedErrors = [
			{
				identifier: 'event-non-existing',
				source: 'fires.ts:15'
			},
			{
				identifier: 'property',
				source: 'fires.ts:15'
			},
			{
				identifier: 'event-non-existing',
				source: 'fires.ts:27'
			},
			{
				identifier: 'property',
				source: 'fires.ts:27'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:event-non-existing',
				source: 'firesabsolute.ts:15'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:property',
				source: 'firesabsolute.ts:15'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:event-non-existing',
				source: 'firesabsolute.ts:21'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:property',
				source: 'firesabsolute.ts:21'
			}
		];

		expect( stubs.onErrorCallback ).toHaveBeenCalledTimes( expectedErrors.length );

		for ( const call of stubs.onErrorCallback.mock.calls ) {
			expect( call ).toSatisfy( call => {
				const [ message, reflection ] = call;

				return expectedErrors.some( error => {
					if ( message !== `Incorrect event name: "${ error.identifier }" in the @fires tag` ) {
						return false;
					}

					if ( testUtils.getSource( reflection ) !== error.source ) {
						return false;
					}

					return true;
				} );
			} );
		}
	} );
} );
