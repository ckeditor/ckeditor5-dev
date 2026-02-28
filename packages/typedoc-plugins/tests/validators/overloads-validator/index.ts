/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
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
import overloadsValidator from '../../../src/validators/overloads-validator/index.js';
import { type ValidatorErrorCallback } from '../../../src/validators/index.js';
import { getPluginPriority } from '../../../src/utils/getpluginpriority.js';

describe( 'typedoc-plugins/validators/overloads-validator', () => {
	const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'validators', 'overloads-validator', 'fixtures' );
	const sourceFilePattern = upath.join( fixturesPath, '**', '*.ts' );

	let onError: ValidatorErrorCallback;

	beforeAll( async () => {
		const files = ( await glob( sourceFilePattern ) ).map( file => upath.normalize( file ) );
		const app = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( fixturesPath, 'tsconfig.test.json' )
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

		app.converter.on( Converter.EVENT_END, ( context: Context ) => {
			overloadsValidator( context, onError );
		}, getPluginPriority( 'validators' ) );

		await app.convert();
	} );

	it( 'should warn if overloaded signature does not have "@label" tag', () => {
		const errorMessage = 'Overloaded signature misses the @label tag';

		const expectedErrors = [
			{ source: 'overloadsinvalid.ts:18' },
			{ source: 'overloadsinvalid.ts:24' },
			{ source: 'overloadsinvalid.ts:34' },
			{ source: 'overloadsinvalid.ts:36' }
		].map( error => ( {
			message: errorMessage,
			source: upath.join( fixturesPath, error.source )
		} ) );

		const errorCalls = vi.mocked( onError ).mock.calls.filter( ( [ message ] ) => {
			return message === errorMessage;
		} );

		assertCalls( errorCalls, expectedErrors );
	} );

	it( 'should warn if overloaded signatures use the same identifier', () => {
		const expectedErrors = [
			{
				source: upath.join( fixturesPath, 'overloadsinvalid.ts:51' ),
				message: 'Duplicated name: "NOT_SO_UNIQUE" in the @label tag'
			}
		];

		const errorCalls = vi.mocked( onError ).mock.calls.filter( ( [ message ] ) => {
			return message.startsWith( 'Duplicated name:' );
		} );

		assertCalls( errorCalls, expectedErrors );
	} );
} );
