/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import testUtils from '../../utils';

import build from '../../../lib/buildtypedoc';

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

vi.mock( '../../../lib/validators/link-validator', async () => {
	const { default: validator } = await vi.importActual( '../../../lib/validators/link-validator' );

	return {
		default: project => validator( project, ( ...args ) => stubs.onErrorCallback( ...args ) )
	};
} );

describe( 'dev-docs/validators/link-validator', function() {
	const FIXTURES_PATH = testUtils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = testUtils.normalizePath( FIXTURES_PATH, '*.ts' );
	const DERIVED_FILE = testUtils.normalizePath( FIXTURES_PATH, 'inheritance', 'derivedclass.ts' );
	const TSCONFIG_PATH = testUtils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	it( 'should warn if link is not valid', async () => {
		await build( {
			type: 'typedoc',
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ SOURCE_FILES ],
			strict: false
		} );

		const expectedErrors = [
			{
				identifier: '.property',
				source: 'links.ts:49'
			},
			{
				identifier: '#staticProperty',
				source: 'links.ts:49'
			},
			{
				identifier: '#property-non-existing',
				source: 'links.ts:49'
			},
			{
				identifier: '#property:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#method:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#methodWithoutComment:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#methodWithoutLabel:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#event-example',
				source: 'links.ts:49'
			},
			{
				identifier: '#event:property',
				source: 'links.ts:49'
			},
			{
				identifier: '~ClassNonExisting#property',
				source: 'links.ts:49'
			},
			{
				identifier: 'module:non-existing/module~ClassWithLinks#property',
				source: 'links.ts:49'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:13'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:62'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:102'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:102'
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

	it( 'should not call error callback for derived class when there are errors in inherited class', async () => {
		await build( {
			type: 'typedoc',
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ DERIVED_FILE ],
			strict: false
		} );

		expect( stubs.onErrorCallback ).toHaveBeenCalledTimes( 0 );
	} );
} );
