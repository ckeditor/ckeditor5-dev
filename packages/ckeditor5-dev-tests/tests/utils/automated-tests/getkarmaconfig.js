/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'getKarmaConfig()', () => {
	let getKarmaConfig, sandbox;
	const originalEnv = process.env;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		sandbox.stub( process, 'cwd' ).returns( 'workspace' );
		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

		// Sinon cannot stub non-existing props.
		process.env = Object.assign( {}, originalEnv, { TRAVIS: false } );

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( './getwebpackconfig', options => options );

		getKarmaConfig = require( '../../../lib/utils/automated-tests/getkarmaconfig' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		mockery.deregisterAll();

		process.env = originalEnv;
	} );

	it( 'should return basic karma config for all tested files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'workspace/path/to/theme.css',
			entryFile: 'workspace/entry-file.js',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig ).to.have.own.property( 'basePath', 'workspace' );
		expect( karmaConfig ).to.have.own.property( 'frameworks' );
		expect( karmaConfig ).to.have.own.property( 'files' );
		expect( karmaConfig ).to.have.own.property( 'preprocessors' );
		expect( karmaConfig ).to.have.own.property( 'webpack' );
		expect( karmaConfig.webpack.files ).to.deep.equal( [ 'workspace/packages/ckeditor5-*/tests/**/*.js' ] );
		expect( karmaConfig.webpack.sourceMap ).to.equal( false );
		expect( karmaConfig.webpack.coverage ).to.equal( false );
		expect( karmaConfig.webpack.themePath ).to.equal( 'workspace/path/to/theme.css' );
		expect( karmaConfig ).to.have.own.property( 'webpackMiddleware' );
		expect( karmaConfig ).to.have.own.property( 'reporters' );
		expect( karmaConfig ).to.have.own.property( 'browsers' );
		expect( karmaConfig ).to.have.own.property( 'singleRun', true );
	} );
} );
