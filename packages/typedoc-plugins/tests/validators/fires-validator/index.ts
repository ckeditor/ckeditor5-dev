/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, beforeAll, expect, vi, type MockContext } from 'vitest';
import { glob } from 'glob';
import * as upath from 'upath';
import { Application } from 'typedoc';

import {
	typeDocModuleFixer,
	typeDocSymbolFixer,
	typeDocTagError,
	typeDocTagEvent,
	typeDocTagObservable,
	typeDocEventParamFixer,
	typeDocEventInheritanceFixer,
	typeDocInterfaceAugmentationFixer,
	typeDocPurgePrivateApiDocs
} from '../../../lib/index.js';

import { ROOT_TEST_DIRECTORY, getSource } from '../../utils.js';
import firesValidator from '../../../lib/validators/fires-validator/index.js';
import { type ValidatorErrorCallback } from '../../../lib/validators/index.js';

describe( 'typedoc-plugins/validators/fires-validator', () => {
	let onError: ValidatorErrorCallback;

	beforeAll( async () => {
		const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'validators', 'fires-validator', 'fixtures' );
		const sourceFilePattern = upath.join( fixturesPath, '**', '*.ts' );

		const files = ( await glob( sourceFilePattern ) ).map( file => upath.normalize( file ) );
		const app = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( fixturesPath, 'tsconfig.json' )
		} );

		onError = vi.fn();

		typeDocModuleFixer( app );
		typeDocSymbolFixer( app );
		typeDocTagError( app );
		typeDocTagEvent( app );
		typeDocTagObservable( app );
		typeDocEventParamFixer( app );
		typeDocEventInheritanceFixer( app );
		typeDocInterfaceAugmentationFixer( app );
		typeDocPurgePrivateApiDocs( app );

		firesValidator( app, onError );

		await app.convert();
	} );

	it( 'should warn if fired event does not exist', async () => {
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

		expect( onError ).toHaveBeenCalledTimes( expectedErrors.length );

		const calls = vi.mocked( onError ).mock.calls;

		for ( const call of calls ) {
			expect( call ).toSatisfy( call => {
				const [ message, node ] = call as MockContext<ValidatorErrorCallback>[ 'calls' ][ 0 ];

				return expectedErrors.some( error => {
					if ( message !== `Incorrect event name: "${ error.identifier }" in the @fires tag` ) {
						return false;
					}

					if ( getSource( node ) !== error.source ) {
						return false;
					}

					return true;
				} );
			} );
		}
	} );
} );
