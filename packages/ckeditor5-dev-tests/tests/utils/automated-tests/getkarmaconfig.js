/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const proxyquire = require( 'proxyquire' );

describe( 'getKarmaConfig', () => {
	let getKarmaConfig, sandbox, stubs;
	const originalEnv = process.env;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		sandbox.stub( process, 'cwd' ).returns( 'workspace' );
		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( path, 'sep' ).value( '/' );
		// Sinon cannot stub non-existing props.
		process.env = Object.assign( {}, originalEnv, { TRAVIS: false } );

		stubs = {
			fs: {
				writeFileSync: sandbox.stub()
			},
			log: {
				info: sandbox.stub(),
				warn: sandbox.stub(),
				error: sandbox.stub(),
			},
			glob: {
				sync: sandbox.stub()
			},
			tmp: {
				fileSync: sandbox.stub().callsFake( () => stubs.tmp._fileSync ),
				_fileSync: {
					name: '',
					removeCallback: sandbox.stub()
				}
			}
		};

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( 'karma/lib/logger.js', {
			create( name ) {
				expect( name ).to.equal( 'config' );

				return stubs.log;
			},
			setupFromConfig: sandbox.spy()
		} );
		mockery.registerMock( './getwebpackconfig', options => options );

		getKarmaConfig = proxyquire( '../../../lib/utils/automated-tests/getkarmaconfig', {
			tmp: stubs.tmp,
			fs: stubs.fs,
			glob: stubs.glob
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		mockery.deregisterAll();
		process.env = originalEnv;
	} );

	it( 'should warn if specified pattern is invalid', () => {
		stubs.glob.sync.returns( [] );

		getKarmaConfig( {
			files: [ 'invalid-package' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false
		} );

		expect( stubs.log.warn.calledOnce ).to.equal( true );
		expect( stubs.log.warn.firstCall.args[ 0 ] ).to.equal( 'Pattern "%s" does not match any file.' );
		expect( stubs.log.warn.firstCall.args[ 1 ] ).to.equal( 'workspace/packages/ckeditor5-invalid-package/tests/**/*.js' );
	} );

	it( 'should log error if not found files to tests', () => {
		stubs.glob.sync.returns( [] );

		getKarmaConfig( {
			files: [ 'invalid-package', 'invalid/foo.js' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false
		} );

		expect( stubs.log.warn.calledTwice ).to.equal( true );
		expect( stubs.log.warn.firstCall.args[ 0 ] ).to.equal( 'Pattern "%s" does not match any file.' );
		expect( stubs.log.warn.firstCall.args[ 1 ] ).to.equal( 'workspace/packages/ckeditor5-invalid-package/tests/**/*.js' );
		expect( stubs.log.warn.secondCall.args[ 0 ] ).to.equal( 'Pattern "%s" does not match any file.' );
		expect( stubs.log.warn.secondCall.args[ 1 ] ).to.equal( 'workspace/packages/ckeditor5-invalid/tests/foo.js' );
		expect( stubs.log.error.calledOnce ).to.equal( true );
		expect( stubs.log.error.firstCall.args[ 0 ] ).to.equal( 'Not found files to tests. Specified patterns are invalid.' );
	} );

	it( 'should return basic karma config for all tested files', () => {
		const allFiles = [
			'workspace/packages/ckeditor5-autoformat/tests/foo.js',
			'workspace/packages/ckeditor5-basic-styles/tests/bar.js',
			'workspace/packages/ckeditor5-engine/tests/foo/bar.js'
		];

		stubs.glob.sync.returns( allFiles );

		sandbox.stub( stubs.tmp._fileSync, 'name' ).value( '/tmp/file' );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false
		} );

		expect( stubs.fs.writeFileSync.calledOnce ).to.equal( true );
		expect( stubs.fs.writeFileSync.firstCall.args[ 0 ] ).to.equal( '/tmp/file' );
		expect( stubs.fs.writeFileSync.firstCall.args[ 1 ] ).to.equal( [
			'import "workspace/packages/ckeditor5-autoformat/tests/foo.js";',
			'import "workspace/packages/ckeditor5-basic-styles/tests/bar.js";',
			'import "workspace/packages/ckeditor5-engine/tests/foo/bar.js";'
		].join( '\n' ) );

		expect( stubs.log.info.calledOnce ).to.equal( true );
		expect( stubs.log.info.firstCall.args[ 0 ] ).to.equal( 'Entry file saved in "%s".' );
		expect( stubs.log.info.firstCall.args[ 1 ] ).to.equal( '/tmp/file' );

		expect( karmaConfig ).to.have.own.property( 'basePath', 'workspace' );
		expect( karmaConfig ).to.have.own.property( 'frameworks' );
		expect( karmaConfig ).to.have.own.property( 'files' );
		expect( karmaConfig ).to.have.own.property( 'preprocessors' );
		expect( karmaConfig ).to.have.own.property( 'webpack' );
		expect( karmaConfig.webpack.files ).to.deep.equal( [ '*' ] );
		expect( karmaConfig.webpack.sourceMap ).to.equal( false );
		expect( karmaConfig.webpack.coverage ).to.equal( false );
		expect( karmaConfig ).to.have.own.property( 'webpackMiddleware' );
		expect( karmaConfig ).to.have.own.property( 'reporters' );
		expect( karmaConfig ).to.have.own.property( 'browsers' );
		expect( karmaConfig ).to.have.own.property( 'singleRun', true );
	} );

	it( 'allows removing temporary entry point', () => {
		const allFiles = [
			'workspace/packages/ckeditor5-autoformat/tests/foo.js',
			'workspace/packages/ckeditor5-basic-styles/tests/bar.js',
			'workspace/packages/ckeditor5-engine/tests/foo/bar.js'
		];

		stubs.glob.sync.returns( allFiles );

		sandbox.stub( stubs.tmp._fileSync, 'name' ).value( '/tmp/file' );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false
		} );

		expect( karmaConfig.removeEntryFile ).to.be.a( 'function' );
		expect( stubs.tmp._fileSync.removeCallback.called ).to.equal( false );
		karmaConfig.removeEntryFile();
		expect( stubs.tmp._fileSync.removeCallback.called ).to.equal( true );
	} );

	it( 'should log error if no files are provided', () => {
		getKarmaConfig( { reporter: 'mocha' } );

		expect( stubs.log.error.calledOnce ).to.equal( true );
		expect( stubs.log.error.firstCall.args[ 0 ] ).to.equal(
			'Karma requires files to tests. `options.files` has to be non-empty array.'
		);
	} );
} );
