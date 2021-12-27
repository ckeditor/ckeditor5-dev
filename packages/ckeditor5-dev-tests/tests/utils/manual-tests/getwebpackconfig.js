/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
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
} );
