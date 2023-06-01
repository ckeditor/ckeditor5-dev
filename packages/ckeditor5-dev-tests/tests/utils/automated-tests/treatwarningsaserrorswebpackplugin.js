/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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

	it( 'should reassign warnings to errors', done => {
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
		}, ( errors, warnings ) => {
			expect( errors.length ).to.equal( 4 );
			expect( warnings.length ).to.equal( 0 );
			expect( errors[ 0 ].message ).to.equal( 'Compilation error 1' );
			expect( errors[ 1 ].message ).to.equal( 'Compilation error 2' );
			expect( errors[ 2 ].message ).to.equal( 'Compilation warning 1' );
			expect( errors[ 3 ].message ).to.equal( 'Compilation warning 2' );
			done();
		} );
	} );
} );

function runCompiler( options, callback ) {
	options.context = path.join( __dirname, 'fixtures' );

	const compiler = webpack( options );

	compiler.outputFileSystem = {};

	compiler.run( ( err, stats ) => {
		callback( stats.compilation.errors, stats.compilation.warnings );
	} );
}
