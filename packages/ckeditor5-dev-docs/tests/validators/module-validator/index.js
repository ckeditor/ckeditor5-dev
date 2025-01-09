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

vi.mock( '../../../lib/validators/module-validator', async () => {
	const { default: validator } = await vi.importActual( '../../../lib/validators/module-validator' );

	return {
		default: project => validator( project, ( ...args ) => stubs.onErrorCallback( ...args ) )
	};
} );

describe( 'dev-docs/validators/module-validator', function() {
	const FIXTURES_PATH = testUtils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = testUtils.normalizePath( FIXTURES_PATH, '**', '*.ts' );
	const TSCONFIG_PATH = testUtils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	it( 'should warn if module name is not valid', async () => {
		await build( {
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ SOURCE_FILES ],
			strict: false
		} );

		const expectedErrors = [
			{
				source: 'ckeditor5-example/src/modulerootinvalid1.ts:10',
				name: 'example/'
			},
			{
				source: 'ckeditor5-example/src/modulerootinvalid2.ts:10',
				name: 'example/foo'
			},
			{
				source: 'ckeditor5-example/src/feature/modulefeatureinvalid1.ts:10',
				name: 'example/feature'
			},
			{
				source: 'ckeditor5-example/src/feature/modulefeatureinvalid2.ts:10',
				name: 'example/feature/foo'
			},
			{
				source: 'ckeditor5-example/src/feature/nested-feature/modulenestedfeatureinvalid1.ts:10',
				name: 'example/feature/nested-feature'
			},
			{
				source: 'ckeditor5-example/src/feature/nested-feature/modulenestedfeatureinvalid2.ts:10',
				name: 'example/feature/nested-feature/foo'
			}
		];

		expect( stubs.onErrorCallback ).toHaveBeenCalledTimes( expectedErrors.length );

		for ( const call of stubs.onErrorCallback.mock.calls ) {
			expect( call ).toSatisfy( call => {
				const [ message, reflection ] = call;

				return expectedErrors.some( error => {
					if ( message !== `Invalid module name: "${ error.name }"` ) {
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
