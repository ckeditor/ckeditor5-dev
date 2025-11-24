/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, beforeAll, vi } from 'vitest';
import { glob } from 'tinyglobby';
import upath from 'upath';
import { Application, Converter, type Context } from 'typedoc';

import {
	typeDocModuleFixer,
	typeDocSymbolFixer,
	typeDocTagError,
	typeDocTagEvent,
	typeDocTagObservable,
	typeDocEventParamFixer,
	typeDocEventInheritanceFixer,
	typeDocInterfaceAugmentationFixer,
	typeDocPurgePrivateApiDocs,
	typeDocRestoreProgramAfterConversion
} from '../../../src/index.js';

import { ROOT_TEST_DIRECTORY, assertCalls } from '../../utils.js';
import firesValidator from '../../../src/validators/fires-validator/index.js';
import { type ValidatorErrorCallback } from '../../../src/validators/index.js';
import { getPluginPriority } from '../../../src/utils/getpluginpriority.js';

describe( 'typedoc-plugins/validators/fires-validator', () => {
	const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'validators', 'fires-validator', 'fixtures' );
	const sourceFilePattern = upath.join( fixturesPath, '**', '*.ts' );

	let onError: ValidatorErrorCallback;

	beforeAll( async () => {
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
		typeDocRestoreProgramAfterConversion( app );

		// TODO: To resolve types.
		// @ts-expect-error TS2339
		// Property 'on' does not exist on type 'Converter'.
		app.converter.on( Converter.EVENT_END, ( context: Context ) => {
			firesValidator( context, onError );
		}, getPluginPriority( 'validators' ) );

		await app.convert();
	} );

	it( 'should warn if fired event does not exist', async () => {
		const expectedErrors = [
			{
				identifier: 'class-non-existing',
				source: 'fires.ts:15'
			},
			{
				identifier: 'class-property',
				source: 'fires.ts:15'
			},
			{
				identifier: 'method-non-existing',
				source: 'fires.ts:27'
			},
			{
				identifier: 'method-property',
				source: 'fires.ts:27'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:non-existing',
				source: 'firesabsolute.ts:17'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:property',
				source: 'firesabsolute.ts:17'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:non-existing',
				source: 'firesabsolute.ts:25'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:property',
				source: 'firesabsolute.ts:25'
			}
		].map( error => ( {
			message: `Incorrect event name: "${ error.identifier }" in the @fires tag`,
			source: upath.join( fixturesPath, error.source )
		} ) );

		const errorCalls = vi.mocked( onError ).mock.calls;

		assertCalls( errorCalls, expectedErrors );
	} );
} );
