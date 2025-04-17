/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { fileURLToPath } from 'url';
import path from 'path';
import testUtils from '../../_utils.js';
import build from '../../../lib/build.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

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

vi.mock( '../../../lib/validators/see-validator', async () => {
	const { default: validator } = await vi.importActual( '../../../lib/validators/see-validator' );

	return {
		default: project => validator( project, ( ...args ) => stubs.onErrorCallback( ...args ) )
	};
} );

describe( 'dev-docs/validators/see-validator', function() {
	const FIXTURES_PATH = testUtils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = testUtils.normalizePath( FIXTURES_PATH, '**', '*.ts' );
	const TSCONFIG_PATH = testUtils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	it( 'should warn if link is not valid', async () => {
		await build( {
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ SOURCE_FILES ],
			strict: false
		} );

		const expectedErrors = [
			{
				identifier: '.property',
				source: 'see.ts:60'
			},
			{
				identifier: '#staticProperty',
				source: 'see.ts:60'
			},
			{
				identifier: '#property-non-existing',
				source: 'see.ts:60'
			},
			{
				identifier: '#property:LABEL-NON-EXISTING',
				source: 'see.ts:60'
			},
			{
				identifier: '#method:LABEL-NON-EXISTING',
				source: 'see.ts:60'
			},
			{
				identifier: '#methodWithoutComment:LABEL-NON-EXISTING',
				source: 'see.ts:60'
			},
			{
				identifier: '#methodWithoutLabel:LABEL-NON-EXISTING',
				source: 'see.ts:60'
			},
			{
				identifier: '#event-example',
				source: 'see.ts:60'
			},
			{
				identifier: '#event:property',
				source: 'see.ts:60'
			},
			{
				identifier: '~ClassNonExisting#property',
				source: 'see.ts:60'
			},
			{
				identifier: 'module:non-existing/module~ClassWithSeeTags#property',
				source: 'see.ts:60'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'see.ts:97'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'see.ts:97'
			}
		];

		expect( stubs.onErrorCallback ).toHaveBeenCalledTimes( expectedErrors.length );

		for ( const call of stubs.onErrorCallback.mock.calls ) {
			expect( call ).toSatisfy( call => {
				const [ message, reflection ] = call;

				return expectedErrors.some( error => {
					if ( message !== `Incorrect link: "${ error.identifier }"` ) {
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
