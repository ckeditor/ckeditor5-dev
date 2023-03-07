/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const TypeDoc = require( 'typedoc' );
const glob = require( 'fast-glob' );

const utils = require( '../utils' );
const { pluginSymbolFixer } = require( '../../lib' );

describe( 'typedoc-plugins/symbol-fixer', function() {
	this.timeout( 10 * 1000 );

	let typeDoc, conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'symbol-fixer', 'fixtures' );

	before( async () => {
		const sourceFilePatterns = [
			utils.normalizePath( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );
		typeDoc = new TypeDoc.Application();

		expect( files ).to.not.lengthOf( 0 );

		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		typeDoc.bootstrap( {
			logLevel: 'Error',
			entryPoints: files,
			plugin: [
				pluginSymbolFixer
			],
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'converts symbols enclosed in square brackets', () => {
		const iteratorReflection = Object.values( conversionResult.reflections ).find( item => item.originalName === '[iterator]' );

		expect( iteratorReflection.name ).to.equal( 'Symbol.iterator' );
	} );

	it( 'prints warning when square brackets contain invalid symbol', () => {
		const fakeReflection = Object.values( conversionResult.reflections ).find( item => item.originalName === '[fake]' );

		expect( fakeReflection.name ).to.equal( '[fake]' );
		expect( typeDoc.logger.warningCount ).to.equal( 1 );

		// `typeDoc.logger.seenWarnings` is an instance of Set.
		const [ warning ] = [ ...typeDoc.logger.seenWarnings ];

		expect( warning ).to.be.a( 'string' );

		// Verify a message reported once find an invalid symbol.
		expect( warning ).to.contain( 'Non-symbol wrapped in square brackets' );

		// Verify whether logger shows an invalid piece of the code.
		expect( warning ).to.contain( 'public [ Symbol.fake ](): Iterable<any> {' );
	} );
} );

