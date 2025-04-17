/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, beforeAll, vi } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
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

import { ROOT_TEST_DIRECTORY, assertCalls } from '../../utils.js';
import moduleValidator from '../../../lib/validators/module-validator/index.js';
import { type ValidatorErrorCallback } from '../../../lib/validators/index.js';

describe( 'typedoc-plugins/validators/module-validator', function() {
	const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'validators', 'module-validator', 'fixtures' );
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

		moduleValidator( app, onError );

		await app.convert();
	} );

	it( 'should warn if module name is not valid', async () => {
		const expectedErrors = [
			{
				identifier: 'example/',
				source: 'ckeditor5-example/src/modulerootinvalid1.ts:10'
			},
			{
				identifier: 'example/foo',
				source: 'ckeditor5-example/src/modulerootinvalid2.ts:10'
			},
			{
				identifier: 'example/feature',
				source: 'ckeditor5-example/src/feature/modulefeatureinvalid1.ts:10'
			},
			{
				identifier: 'example/feature/foo',
				source: 'ckeditor5-example/src/feature/modulefeatureinvalid2.ts:10'
			},
			{
				identifier: 'example/feature/nested-feature',
				source: 'ckeditor5-example/src/feature/nested-feature/modulenestedfeatureinvalid1.ts:10'
			},
			{
				identifier: 'example/feature/nested-feature/foo',
				source: 'ckeditor5-example/src/feature/nested-feature/modulenestedfeatureinvalid2.ts:10'
			}
		].map( error => ( {
			message: `Invalid module name: "${ error.identifier }"`,
			source: upath.join( fixturesPath, error.source )
		} ) );

		const errorCalls = vi.mocked( onError ).mock.calls;

		assertCalls( errorCalls, expectedErrors );
	} );
} );
