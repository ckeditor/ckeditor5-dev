/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import webpack from 'webpack';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import TreatWarningsAsErrorsWebpackPlugin from '../../../lib/utils/automated-tests/treatwarningsaserrorswebpackplugin.js';

describe( 'TreatWarningsAsErrorsWebpackPlugin', () => {
	it( 'should reassign warnings to errors, emit the code and make the bundle fail', () => {
		return new Promise( ( resolve, reject ) => {
			runCompiler(
				{
					mode: 'development',
					entry: './treatwarningsaserrorswebpackplugin/entrypoint.cjs',
					plugins: [
						{
							apply( compiler ) {
								compiler.hooks.make.tap( 'MakeCompilationWarning', compilation => {
									compilation.errors.push( new Error( 'Compilation error 1' ) );
									compilation.warnings.push( new Error( 'Compilation warning 1' ) );
								} );
							}
						},
						new TreatWarningsAsErrorsWebpackPlugin()
					]
				},
				( err, stats, outputPath ) => {
					if ( err ) {
						return reject( err );
					}

					try {
						const statsJson = stats.toJson( { errorDetails: false } );
						const asset = statsJson.assets.find( asset => asset.name.endsWith( '.js' ) );
						const assetContent = fs.readFileSync( path.join( outputPath, asset.name ), 'utf-8' );

						expect( statsJson.errors.length ).to.equal( 2 );
						expect( statsJson.warnings.length ).to.equal( 0 );
						expect( statsJson.errors[ 0 ].message ).to.equal( 'Compilation error 1' );
						expect( statsJson.errors[ 1 ].message ).to.equal( 'Compilation warning 1' );
						expect( asset.emitted ).to.equal( true );
						expect( assetContent ).to.contain( 'Webpack compilation failed. See terminal output for details.' );
						resolve();
					} catch ( error ) {
						reject( error );
					}
				} );
		} );
	} );
} );

function runCompiler( options, callback ) {
	options.context = path.join( import.meta.dirname, '..', '..', 'fixtures' );
	options.output = {
		path: fs.mkdtempSync( path.join( os.tmpdir(), 'treat-warnings-as-errors-webpack-plugin-' ) )
	};

	const compiler = webpack( options );

	compiler.run( ( err, stats ) => {
		compiler.close( closeError => {
			callback( err || closeError, stats, options.output.path );
			fs.rmSync( options.output.path, { recursive: true, force: true } );
		} );
	} );
}
