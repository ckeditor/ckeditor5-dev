/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );

describe( 'getWebpackConfigForManualTests()', () => {
	let getWebpackConfigForManualTests;

	beforeEach( () => {
		getWebpackConfigForManualTests = require( '../../../lib/utils/manual-tests/getwebpackconfig' );
	} );

	it( 'should return webpack configuration object', () => {
		const entries = {
			'ckeditor5/tests/manual/all-features': '/home/ckeditor/ckeditor5/tests/manual/all-features.js'
		};

		const buildDir = '/home/ckeditor/ckeditor5/build/.manual-tests';

		const webpackConfig = getWebpackConfigForManualTests( {
			entries, buildDir
		} );

		expect( webpackConfig ).to.be.an( 'object' );

		expect( webpackConfig.resolve ).to.deep.equal( {
			extensions: [ '.ts', '.js', '.json' ]
		} );

		// To avoid "eval()" in files.
		expect( webpackConfig ).to.have.property( 'mode', 'none' );
		expect( webpackConfig ).to.have.property( 'entry', entries );
		expect( webpackConfig ).to.have.property( 'output' );
		expect( webpackConfig.output ).to.deep.equal( { path: buildDir } );
		expect( webpackConfig ).to.have.property( 'plugins' );
		expect( webpackConfig ).to.have.property( 'watch', true );

		// The `devtool` property has been replaced by the `SourceMapDevToolPlugin()`.
		expect( webpackConfig ).to.not.have.property( 'devtool' );
	} );

	it( 'should disable watcher mechanism when passing the "disableWatch" option', () => {
		const webpackConfig = getWebpackConfigForManualTests( { disableWatch: true } );

		expect( webpackConfig ).to.be.an( 'object' );
		expect( webpackConfig ).to.not.have.property( 'devtool' );
		expect( webpackConfig ).to.not.have.property( 'watch' );
	} );

	it( 'should process TypeScript files properly', () => {
		const webpackConfig = getWebpackConfigForManualTests( {} );
		const tsRule = webpackConfig.module.rules.find( rule => {
			return rule.test.toString().endsWith( '/\\.ts$/' );
		} );

		if ( !tsRule ) {
			throw new Error( 'A loader for ".ts" files was not found.' );
		}

		expect( tsRule.use[ 0 ].loader.endsWith( 'ck-debug-loader.js' ) ).to.be.true;
		expect( tsRule.use[ 1 ] ).to.be.an( 'object' );
		expect( tsRule.use[ 1 ] ).to.have.property( 'loader', 'ts-loader' );
		expect( tsRule.use[ 1 ] ).to.have.property( 'options' );
		expect( tsRule.use[ 1 ].options ).to.have.property( 'compilerOptions' );
		expect( tsRule.use[ 1 ].options.compilerOptions ).to.deep.equal( {
			noEmit: false,
			noEmitOnError: false
		} );
	} );
} );
