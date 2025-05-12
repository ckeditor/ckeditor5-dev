/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, beforeAll, expect } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import { Application, type ProjectReflection } from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocModuleFixer, typeDocRestoreProgramAfterConversion } from '../../src/index.js';

describe( 'typedoc-plugins/module-fixer', () => {
	let conversionResult: ProjectReflection;

	beforeAll( async () => {
		const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'module-fixer', 'fixtures' );

		const sourceFilePatterns = [
			upath.join( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.json' )
		} );

		typeDocModuleFixer( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should parse the module definition from a file without import statements', () => {
		const errorModule = conversionResult.children!.find( doclet => doclet.name === 'fixtures/error' );

		expect( errorModule ).to.not.be.undefined;
	} );

	it( 'should parse the module definition from a file with import type statements', () => {
		const errorModule = conversionResult.children!.find( doclet => doclet.name === 'fixtures/logger' );

		expect( errorModule ).to.not.be.undefined;
	} );

	it( 'should parse the module definition from a file with import statements', () => {
		const errorModule = conversionResult.children!.find( doclet => doclet.name === 'fixtures/customerror' );

		expect( errorModule ).to.not.be.undefined;
	} );
} );
