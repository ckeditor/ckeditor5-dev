/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const webpack = require( 'webpack' );
const path = require( 'path' );
const { expect } = require( 'chai' );

describe( 'TreatWarningsAsErrorsWebpackPlugin()', () => {
	let TreatWarningsAsErrorsWebpackPlugin;

	beforeEach( () => {
		TreatWarningsAsErrorsWebpackPlugin = require( '../../../lib/utils/automated-tests/treatwarningsaserrorswebpackplugin' );
	} );

	it( 'should reassign warnings to errors and not emit the code when errors are present', done => {
		runCompiler( {
			mode: 'development',
			entry: './file',
			plugins: [
				{
					apply( compiler ) {
						compiler.hooks.make.tap( 'MakeCompilationWarning', compilation => {
							compilation.errors.push( new Error( 'Compilation error 1' ) );
							compilation.errors.push( new Error( 'Compilation error 2' ) );
							compilation.warnings.push( new Error( 'Compilation warning 1' ) );
							compilation.warnings.push( new Error( 'Compilation warning 2' ) );
						} );
					}
				},
				new TreatWarningsAsErrorsWebpackPlugin()
			]
		}, stats => {
			const statsJson = stats.toJson( { errorDetails: false } );

			expect( statsJson.errors.length ).to.equal( 4 );
			expect( statsJson.warnings.length ).to.equal( 0 );
			expect( statsJson.errors[ 0 ].message ).to.equal( 'Compilation error 1' );
			expect( statsJson.errors[ 1 ].message ).to.equal( 'Compilation error 2' );
			expect( statsJson.errors[ 2 ].message ).to.equal( 'Compilation warning 1' );
			expect( statsJson.errors[ 3 ].message ).to.equal( 'Compilation warning 2' );
			expect( statsJson.assets[ 0 ].emitted ).to.equal( false );
			done();
		} );
	} );
} );

function runCompiler( options, callback ) {
	options.context = path.join( __dirname, 'fixtures' );

	const compiler = webpack( options );

	compiler.outputFileSystem = {};

	compiler.run( ( err, stats ) => {
		callback( stats );
	} );
}
