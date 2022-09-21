/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const path = require( 'path' );
const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const paths = require( '../utils' );

const FIXTURES_PATH = path.join( paths.ROOT_TEST_DIRECTORY, 'module-fixer', 'fixtures' );

describe( 'module-fixer', function() {
	this.timeout( 10 * 1000 );

	let conversionResult;

	before( async () => {
		const sourceFilePatterns = [
			path.join( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );
		const typeDoc = new TypeDoc.Application();

		expect( files ).to.not.lengthOf( 0 );

		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		typeDoc.bootstrap( {
			logLevel: 'Error',
			entryPoints: files,
			plugin: [
				require.resolve( '@ckeditor/typedoc-plugins/lib/module-fixer' )
			],
			// TODO: To resolve once the same problem is fixed in the `@ckeditor/ckeditor5-dev-docs` package.
			tsconfig: path.join( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should parse the module definition from a file without import statements', () => {
		const errorModule = conversionResult.children.find( doclet => doclet.name === 'fixtures/error' );

		expect( errorModule ).to.not.be.undefined;
	} );

	it( 'should parse the module definition from a file with import type statements', () => {
		const errorModule = conversionResult.children.find( doclet => doclet.name === 'fixtures/logger' );

		expect( errorModule ).to.not.be.undefined;
	} );

	it( 'should parse the module definition from a file with import statements', () => {
		const errorModule = conversionResult.children.find( doclet => doclet.name === 'fixtures/customerror' );

		expect( errorModule ).to.not.be.undefined;
	} );
} );
