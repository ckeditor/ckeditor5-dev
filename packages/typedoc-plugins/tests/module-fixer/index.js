/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const { glob } = require( 'glob' );
const { Application } = require( 'typedoc' );

const utils = require( '../utils' );
const { plugins } = require( '../../lib' );

describe( 'typedoc-plugins/module-fixer', function () {
	this.timeout( 10 * 1000 );

	let conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'module-fixer', 'fixtures' );

	before( async () => {
		const sourceFilePatterns = [
			utils.normalizePath( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			plugin: [
				plugins[ 'typedoc-plugin-module-fixer' ]
			],
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = await typeDoc.convert();

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
