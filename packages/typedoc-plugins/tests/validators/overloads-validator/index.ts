/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, beforeAll, vi } from 'vitest';
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

import { ROOT_TEST_DIRECTORY, assertCalls, normalizeExpectedError } from '../../utils.js';
import overloadsValidator from '../../../lib/validators/overloads-validator/index.js';
import { type ValidatorErrorCallback } from '../../../lib/validators/index.js';

describe( 'typedoc-plugins/validators/overloads-validator', function() {
	const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'validators', 'overloads-validator', 'fixtures' );
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

		overloadsValidator( app, onError );

		await app.convert();
	} );

	it( 'should warn if overloaded signature does not have "@label" tag', () => {
		const errorMessage = 'Overloaded signature misses the @label tag';

		const expectedErrors = [
			{ source: 'overloadsinvalid.ts:18' },
			{ source: 'overloadsinvalid.ts:24' },
			{ source: 'overloadsinvalid.ts:34' },
			{ source: 'overloadsinvalid.ts:36' }
		].map( normalizeExpectedError( fixturesPath, () => errorMessage ) );

		const errorCalls = vi.mocked( onError ).mock.calls.filter( ( [ message ] ) => {
			return message === errorMessage;
		} );

		assertCalls( errorCalls, expectedErrors );
	} );

	it( 'should warn if overloaded signatures use the same identifier', () => {
		const expectedErrors = [
			{ source: 'overloadsinvalid.ts:51', identifier: 'NOT_SO_UNIQUE' }
		].map( normalizeExpectedError( fixturesPath, identifier => `Duplicated name: "${ identifier }" in the @label tag` ) );

		const errorCalls = vi.mocked( onError ).mock.calls.filter( ( [ message ] ) => {
			return message.startsWith( 'Duplicated name:' );
		} );

		assertCalls( errorCalls, expectedErrors );
	} );
} );
