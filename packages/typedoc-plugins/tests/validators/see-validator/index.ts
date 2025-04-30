/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, beforeAll, vi } from 'vitest';
import { glob } from 'glob';
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
import seeValidator from '../../../src/validators/see-validator/index.js';
import { type ValidatorErrorCallback } from '../../../src/validators/index.js';
import { getPluginPriority } from '../../../src/utils/getpluginpriority.js';

describe( 'typedoc-plugins/validators/see-validator', () => {
	const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'validators', 'see-validator', 'fixtures' );
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
			seeValidator( context, onError );
		}, getPluginPriority( 'validators' ) );

		await app.convert();
	} );

	it( 'should warn if link is not valid', async () => {
		const expectedErrors = [
			{
				identifier: '.property',
				source: 'see.ts:63'
			},
			{
				identifier: '#staticProperty',
				source: 'see.ts:63'
			},
			{
				identifier: '#property-non-existing',
				source: 'see.ts:63'
			},
			{
				identifier: '#property:LABEL-NON-EXISTING',
				source: 'see.ts:63'
			},
			{
				identifier: '#method:LABEL-NON-EXISTING',
				source: 'see.ts:63'
			},
			{
				identifier: '#methodWithoutComment:LABEL-NON-EXISTING',
				source: 'see.ts:63'
			},
			{
				identifier: '#methodWithoutLabel:LABEL-NON-EXISTING',
				source: 'see.ts:63'
			},
			{
				identifier: '#event-example',
				source: 'see.ts:63'
			},
			{
				identifier: '#event:example:invalid',
				source: 'see.ts:63'
			},
			{
				identifier: '#event:property',
				source: 'see.ts:63'
			},
			{
				identifier: '~ClassNonExisting#property',
				source: 'see.ts:63'
			},
			{
				identifier: 'module:non-existing/module~ClassWithSeeTags#property',
				source: 'see.ts:63'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'see.ts:100'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'see.ts:100'
			}
		].map( error => ( {
			message: `Incorrect link: "${ error.identifier }"`,
			source: upath.join( fixturesPath, error.source )
		} ) );

		const errorCalls = vi.mocked( onError ).mock.calls;

		assertCalls( errorCalls, expectedErrors );
	} );
} );
