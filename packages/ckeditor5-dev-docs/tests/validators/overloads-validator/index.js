/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock( '../../../lib/validators/overloads-validator', async () => {
	const { default: validator } = await vi.importActual( '../../../lib/validators/overloads-validator' );

	return {
		default: project => validator( project, ( ...args ) => stubs.onErrorCallback( ...args ) )
	};
} );

describe( 'dev-docs/validators/overloads-validator', function() {
	const FIXTURES_PATH = testUtils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = testUtils.normalizePath( FIXTURES_PATH, '**', '*.ts' );
	const TSCONFIG_PATH = testUtils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	beforeEach( async () => {
		await build( {
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ SOURCE_FILES ],
			strict: false,
			validatorOptions: {
				enableOverloadValidator: true
			}
		} );
	} );

	it( 'should warn if overloaded signature does not have "@label" tag', () => {
		const expectedErrors = [
			{ source: 'overloadsinvalid.ts:34' },
			{ source: 'overloadsinvalid.ts:36' },
			{ source: 'overloadsinvalid.ts:18' },
			{ source: 'overloadsinvalid.ts:24' }
		];

		const errorCalls = stubs.onErrorCallback.mock.calls.filter( ( [ message ] ) => {
			return message === 'Overloaded signature misses the @label tag';
		} );

		expect( errorCalls.length ).to.equal( expectedErrors.length );

		for ( const call of errorCalls ) {
			expect( call ).toSatisfy( call => {
				const [ , reflection ] = call;

				return expectedErrors.some( error => {
					return testUtils.getSource( reflection ) === error.source;
				} );
			} );
		}
	} );

	it( 'should warn if overloaded signatures use the same identifier', () => {
		const expectedErrors = [
			{ source: 'overloadsinvalid.ts:51', error: 'Duplicated name: "NOT_SO_UNIQUE" in the @label tag' }
		];

		const errorCalls = stubs.onErrorCallback.mock.calls.filter( ( [ message ] ) => {
			return message.startsWith( 'Duplicated name' );
		} );

		expect( errorCalls.length ).to.equal( expectedErrors.length );

		for ( const call of errorCalls ) {
			expect( call ).toSatisfy( call => {
				const [ message, reflection ] = call;

				return expectedErrors.some( ( { source, error } ) => {
					if ( message !== error ) {
						return false;
					}

					if ( testUtils.getSource( reflection ) !== source ) {
						return false;
					}

					return true;
				} );
			} );
		}
	} );
} );
