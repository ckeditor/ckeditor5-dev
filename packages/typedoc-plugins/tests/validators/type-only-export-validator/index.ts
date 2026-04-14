/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, describe, it, vi } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import { Application, Converter, type Context } from 'typedoc';

import {
	typeDocEventInheritanceFixer,
	typeDocEventParamFixer,
	typeDocInterfaceAugmentationFixer,
	typeDocModuleFixer,
	typeDocPurgePrivateApiDocs,
	typeDocRestoreProgramAfterConversion,
	typeDocSymbolFixer,
	typeDocTagError,
	typeDocTagEvent,
	typeDocTagObservable
} from '../../../src/index.js';

import { assertCalls, ROOT_TEST_DIRECTORY } from '../../utils.js';
import { getPluginPriority } from '../../../src/utils/getpluginpriority.js';
import typeOnlyExportValidator from '../../../src/validators/type-only-export-validator/index.js';
import { type ValidatorErrorCallback } from '../../../src/validators/index.js';

describe( 'typedoc-plugins/validators/type-only-export-validator', () => {
	const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'validators', 'type-only-export-validator', 'fixtures' );
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
			typeOnlyExportValidator( context, onError );
		}, getPluginPriority( 'validators' ) );

		await app.convert();
	} );

	it( 'should warn when a class is exported as a type-only export', async () => {
		const expectedErrors = [
			{
				identifier: 'MyClass',
				source: 'ckeditor5-example/src/index.ts:11'
			},
			{
				identifier: 'AnotherClass',
				source: 'ckeditor5-example/src/index.ts:14'
			},
			{
				identifier: 'AliasedClass',
				aliasedName: 'RenamedClass',
				source: 'ckeditor5-example/src/index.ts:17'
			},
			{
				identifier: 'MixedClass',
				source: 'ckeditor5-example/src/index.ts:20'
			}
		].map( error => ( {
			message: 'aliasedName' in error && error.aliasedName ?
				`Class "${ error.identifier }" (exported as "${ error.aliasedName }") must not be exported as a type-only export.` :
				`Class "${ error.identifier }" must not be exported as a type-only export.`,
			source: upath.join( fixturesPath, error.source )
		} ) );

		const errorCalls = vi.mocked( onError ).mock.calls;

		assertCalls( errorCalls, expectedErrors );
	} );
} );
