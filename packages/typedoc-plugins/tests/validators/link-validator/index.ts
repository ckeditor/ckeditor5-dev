/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, type MockContext } from 'vitest';
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
import linkValidator from '../../../lib/validators/link-validator/index.js';
import { type ValidatorErrorCallback } from '../../../lib/validators/index.js';

describe( 'dev-docs/validators/link-validator', function() {
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

		linkValidator( app, onError );

		return app.convert();
	}

	it( 'should warn if link is not valid', async () => {
		await build( sourceFilePattern );

		const expectedErrors = [
			{
				identifier: '.property',
				source: 'links.ts:49'
			},
			{
				identifier: '#staticProperty',
				source: 'links.ts:49'
			},
			{
				identifier: '#property-non-existing',
				source: 'links.ts:49'
			},
			{
				identifier: '#property:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#method:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#methodWithoutComment:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#methodWithoutLabel:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#event-example',
				source: 'links.ts:49'
			},
			{
				identifier: '#event:property',
				source: 'links.ts:49'
			},
			{
				identifier: '~ClassNonExisting#property',
				source: 'links.ts:49'
			},
			{
				identifier: 'module:non-existing/module~ClassWithLinks#property',
				source: 'links.ts:49'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:13'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:62'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:102'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:102'
			}
		];

		expect( onError ).toHaveBeenCalledTimes( expectedErrors.length );

		const calls = vi.mocked( onError ).mock.calls;

		for ( const call of calls ) {
			expect( call ).toSatisfy( call => {
				const [ message, node ] = call as MockContext<ValidatorErrorCallback>[ 'calls' ][ 0 ];

				return expectedErrors.some( error => {
					if ( message !== `Incorrect link: "${ error.identifier }"` ) {
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

	it( 'should not call error callback for derived class when there are errors in inherited class', async () => {
		await build( derivedFilePath );

		expect( onError ).toHaveBeenCalledTimes( 0 );
	} );
} );
