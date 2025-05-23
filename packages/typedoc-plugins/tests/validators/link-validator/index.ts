/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
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
import linkValidator from '../../../src/validators/link-validator/index.js';
import { type ValidatorErrorCallback } from '../../../src/validators/index.js';
import { getPluginPriority } from '../../../src/utils/getpluginpriority.js';

describe( 'typedoc-plugins/validators/link-validator', () => {
	const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'validators', 'link-validator', 'fixtures' );
	const sourceFilePattern = upath.join( fixturesPath, '*.ts' );
	const derivedFilePath = upath.join( fixturesPath, 'inheritance', 'derivedclass.ts' );

	let onError: ValidatorErrorCallback;

	async function build( sourceFilePattern: string ) {
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
			linkValidator( context, onError );
		}, getPluginPriority( 'validators' ) );

		return app.convert();
	}

	it( 'should warn if link is not valid', async () => {
		await build( sourceFilePattern );

		const expectedErrors = [
			{
				identifier: '.property',
				source: 'links.ts:51'
			},
			{
				identifier: '#staticProperty',
				source: 'links.ts:51'
			},
			{
				identifier: '#property-non-existing',
				source: 'links.ts:51'
			},
			{
				identifier: '#property:LABEL-NON-EXISTING',
				source: 'links.ts:51'
			},
			{
				identifier: '#method:LABEL-NON-EXISTING',
				source: 'links.ts:51'
			},
			{
				identifier: '#methodWithoutComment:LABEL-NON-EXISTING',
				source: 'links.ts:51'
			},
			{
				identifier: '#methodWithoutLabel:LABEL-NON-EXISTING',
				source: 'links.ts:51'
			},
			{
				identifier: '#example',
				source: 'links.ts:51'
			},
			{
				identifier: '#event:property',
				source: 'links.ts:51'
			},
			{
				identifier: '~ClassNonExisting#property',
				source: 'links.ts:51'
			},
			{
				identifier: 'module:non-existing/module~ClassWithLinks#property',
				source: 'links.ts:51'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:13'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:64'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:104'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:104'
			}
		].map( error => ( {
			message: `Incorrect link: "${ error.identifier }"`,
			source: upath.join( fixturesPath, error.source )
		} ) );

		const errorCalls = vi.mocked( onError ).mock.calls;

		assertCalls( errorCalls, expectedErrors );
	} );

	it( 'should not call error callback for derived class when there are errors in inherited class', async () => {
		await build( derivedFilePath );

		expect( onError ).toHaveBeenCalledTimes( 0 );
	} );
} );
