/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'compileManualTestScripts', () => {
	let sandbox, stubs, webpackError, compileManualTestScripts;

	beforeEach( () => {
		webpackError = null;

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		sandbox = sinon.sandbox.create();

		stubs = {
			glob: sandbox.stub(),
			webpack: sandbox.spy( ( config, callback ) => {
				callback( webpackError );
			} ),
			getWebpackConfig: sandbox.spy( ( entries, buildDir ) => ( {
				entries,
				buildDir
			} ) ),
			getRelativeFilePath: sandbox.spy( ( x ) => x ),
			pathJoin: sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) )
		};

		mockery.registerMock( '../glob', stubs.glob );
		mockery.registerMock( './getwebpackconfig', stubs.getWebpackConfig );
		mockery.registerMock( '../getrelativefilepath', stubs.getRelativeFilePath );
		mockery.registerMock( 'webpack', stubs.webpack );

		compileManualTestScripts = require( '../../../lib/utils/manual-tests/compilescripts' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should compile manual test scripts', () => {
		stubs.glob.returns( [ 'ckeditor5-foo/manual/file1', 'ckeditor5-foo/manual/file2' ] );

		return compileManualTestScripts( 'buildDir', [ 'manualTestPattern' ] )
			.then( () => {
				expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );
				expect( stubs.getWebpackConfig.firstCall.args[ 0 ] ).to.deep.equal( {
					'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1',
					'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2'
				} );
				expect( stubs.getWebpackConfig.firstCall.args[ 1 ] ).to.deep.equal( 'buildDir' );

				expect( stubs.webpack.calledOnce ).to.equal( true );
				expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'buildDir',
					entries: {
						'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1',
						'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2'
					}
				} );

				expect( stubs.glob.calledOnce ).to.equal( true );
				expect( stubs.glob.firstCall.args[ 0 ] ).to.equal( 'manualTestPattern' );
			} );
	} );

	it( 'resolves a few entry points patterns', () => {
		const manualTestScriptsPatterns = [
			'ckeditor5-build-classic/tests/**/manual/**/*.js',
			'ckeditor5-editor-classic/tests/manual/**/*.js'
		];

		stubs.glob.onFirstCall().returns( [
			'ckeditor5-build-classic/tests/manual/ckeditor.js',
			'ckeditor5-build-classic/tests/manual/ckeditor.compcat.js'
		] );

		stubs.glob.onSecondCall().returns( [
			'ckeditor5-editor-classic/tests/manual/classic.js'
		] );

		return compileManualTestScripts( 'buildDir', manualTestScriptsPatterns )
			.then( () => {
				expect( stubs.glob.calledTwice ).to.equal( true );
				expect( stubs.glob.firstCall.args[ 0 ] ).to.equal( manualTestScriptsPatterns[ 0 ] );
				expect( stubs.glob.secondCall.args[ 0 ] ).to.equal( manualTestScriptsPatterns[ 1 ] );

				expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

				expect( stubs.getRelativeFilePath.calledThrice ).to.equal( true );
				expect( stubs.getRelativeFilePath.firstCall.args[ 0 ] )
					.to.equal( 'ckeditor5-build-classic/tests/manual/ckeditor.js' );
				expect( stubs.getRelativeFilePath.secondCall.args[ 0 ] )
					.to.equal( 'ckeditor5-build-classic/tests/manual/ckeditor.compcat.js' );
				expect( stubs.getRelativeFilePath.thirdCall.args[ 0 ] )
					.to.equal( 'ckeditor5-editor-classic/tests/manual/classic.js'
				);
			} );
	} );

	it( 'rejects if Webpack threw an error', () => {
		webpackError = new Error( 'Unexpected error.' );

		stubs.glob.returns( [ 'ckeditor5-foo/manual/file1', 'ckeditor5-foo/manual/file2' ] );

		return compileManualTestScripts( 'buildDir', [ 'manualTestPattern' ] )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				( err ) => {
					expect( err ).to.equal( webpackError );
				}
			);
	} );

	it( 'compiles only manual test files', () => {
		const manualTestScriptsPatterns = [
			'ckeditor5-build-classic/tests/**/*.js',
		];

		stubs.glob.onFirstCall().returns( [
			'ckeditor5-build-classic/tests/manual/ckeditor.js',
			'ckeditor5-build-classic/tests/ckeditor.js'
		] );

		return compileManualTestScripts( 'buildDir', manualTestScriptsPatterns )
			.then( () => {
				expect( stubs.getRelativeFilePath.calledOnce ).to.equal( true );
				expect( stubs.getRelativeFilePath.firstCall.args[ 0 ] )
					.to.equal( 'ckeditor5-build-classic/tests/manual/ckeditor.js' );

				expect(
					stubs.getRelativeFilePath.neverCalledWith( 'ckeditor5-build-classic/tests/ckeditor.js' )
				).to.equal( true );
			} );
	} );
} );
