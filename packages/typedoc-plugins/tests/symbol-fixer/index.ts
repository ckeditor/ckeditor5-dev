/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, beforeAll, expect, vi } from 'vitest';
import { glob } from 'glob';
import { Application, Converter, ReflectionKind, type ProjectReflection, type Context, FancyConsoleLogger } from 'typedoc';

import { normalizePath, ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocSymbolFixer } from '../../lib/index.js';


class CustomLogger extends FancyConsoleLogger {
	// logLevel: LogLevel = LogLevel.Info;
	public seenWarnings = new Set<string>();

	public error(message: string): void {
		console.error(message);
	}

	public warn(message: string): void {
		this.seenWarnings.add(message);
		console.warn(message);
	}

	public info(message: string): void {
		console.info(message);
	}

	public verbose(message: string): void {
		console.debug(message);
	}

	public success(message: string): void {
		console.log(message);
	}
}

describe.only( 'typedoc-plugins/symbol-fixer', function () {
	let typeDoc: Application,
		conversionResult: ProjectReflection,
		warnSpy: any;

	beforeAll( async () => {
		const FIXTURES_PATH = normalizePath( ROOT_TEST_DIRECTORY, 'symbol-fixer', 'fixtures' );

		const sourceFilePatterns = [
			normalizePath( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );

		typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		typeDoc.logger = new CustomLogger();

		// Set up the spy to capture warnings
		// warnSpy = vi.spyOn( typeDoc.logger, 'warn' );

		typeDocSymbolFixer( typeDoc );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
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

		expect( typeDoc.logger.warningCount ).to.equal( 1 );

		console.log( warnSpy.mock.calls );
		// console.log( typeDoc.logger.getWarnings() );

		// `typeDoc.logger.seenWarnings` is an instance of Set.
		const [ warning ] = [ ...typeDoc.logger.seenWarnings ];
		//
		// expect( warning ).to.be.a( 'string' );
		//
		// // Verify a message reported once find an invalid symbol.
		// expect( warning ).to.contain( 'Non-symbol wrapped in square brackets' );
		//
		// // Verify whether logger shows an invalid piece of the code.
		// expect( warning ).to.contain( 'public [ Symbol.fake ](): Iterable<any> {' );
	} );
} );

