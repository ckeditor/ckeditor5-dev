/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { glob } from 'tinyglobby';
import upath from 'upath';
import { Application, type ProjectReflection, ReflectionKind } from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocRestoreProgramAfterConversion, typeDocSymbolFixer } from '../../src/index.js';

describe( 'typedoc-plugins/symbol-fixer', () => {
	let typeDoc: Application,
		conversionResult: ProjectReflection,
		warnSpy: any;

	beforeAll( async () => {
		const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'symbol-fixer', 'fixtures' );

		const sourceFilePatterns = [
			upath.join( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );

		typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.json' )
		} );

		warnSpy = vi.spyOn( typeDoc.logger, 'warn' );

		typeDocSymbolFixer( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	afterAll( () => {
		vi.restoreAllMocks();
	} );

	it( 'converts symbols enclosed in square brackets', () => {
		const iteratorReflection = conversionResult.getReflectionsByKind( ReflectionKind.Method )
			.find( item => item.name === 'Symbol.iterator' );

		expect( iteratorReflection ).toBeTruthy();
	} );

	it( 'prints warning when square brackets contain invalid symbol', () => {
		const iteratorReflection = conversionResult.getReflectionsByKind( ReflectionKind.Method )
			.find( item => item.name === '[fake]' );

		expect( iteratorReflection ).toBeTruthy();

		expect( warnSpy ).toHaveBeenCalledOnce();
		expect( warnSpy ).toHaveBeenCalledWith( 'Non-symbol wrapped in square brackets', expect.any( Object ) );
	} );
} );

