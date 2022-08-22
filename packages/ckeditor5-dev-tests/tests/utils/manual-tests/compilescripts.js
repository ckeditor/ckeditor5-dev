/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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

		sandbox = sinon.createSandbox();

		stubs = {
			glob: sandbox.stub(),
			webpack: sandbox.spy( ( config, callback ) => {
				callback( webpackError );
			} ),
			getWebpackConfig: sandbox.spy( ( { entries, buildDir } ) => ( {
				entries,
				buildDir
			} ) ),
			getRelativeFilePath: sandbox.spy( x => x ),
			pathJoin: sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) ),
			pathSep: sandbox.stub( path, 'sep' ).value( '/' ),
			onTestCompilationStatus: sinon.stub()
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

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: [ 'manualTestPattern' ],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: false
		} ).then( () => {
			expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

			sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
				buildDir: 'buildDir',
				themePath: 'path/to/theme',
				language: 'en',
				onTestCompilationStatus: stubs.onTestCompilationStatus,
				additionalLanguages: [ 'pl', 'ar' ],
				entries: {
					'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1',
					'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2'
				},
				debug: [ 'CK_DEBUG' ],
				disableWatch: false,
				identityFile: undefined
			} );

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

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: manualTestScriptsPatterns,
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: null
		} ).then( () => {
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
				.to.equal( 'ckeditor5-editor-classic/tests/manual/classic.js' );
		} );
	} );

	it( 'rejects if Webpack threw an error', () => {
		webpackError = new Error( 'Unexpected error.' );

		stubs.glob.returns( [ 'ckeditor5-foo/manual/file1', 'ckeditor5-foo/manual/file2' ] );

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: [ 'manualTestPattern' ],
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: null
		} ).then(
			() => {
				throw new Error( 'Expected to be rejected.' );
			},
			err => {
				expect( err ).to.equal( webpackError );
			}
		);
	} );

	it( 'compiles only manual test files (ignores utils and files outside the manual directory)', () => {
		const manualTestScriptsPatterns = [
			'ckeditor5-build-classic/tests/**/*.js'
		];

		stubs.glob.onFirstCall().returns( [
			'ckeditor5-build-classic/tests/manual/ckeditor.js',
			'ckeditor5-build-classic/tests/manual/_utils/secretplugin.js',
			'ckeditor5-build-classic/tests/ckeditor.js'
		] );

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: manualTestScriptsPatterns,
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: null
		} ).then( () => {
			expect( stubs.getRelativeFilePath.calledOnce ).to.equal( true );
			expect( stubs.getRelativeFilePath.firstCall.args[ 0 ] )
				.to.equal( 'ckeditor5-build-classic/tests/manual/ckeditor.js' );

			expect(
				stubs.getRelativeFilePath.neverCalledWith( 'ckeditor5-build-classic/tests/ckeditor.js' )
			).to.equal( true );
		} );
	} );

	it( 'works on Windows environments', () => {
		stubs.pathSep.resetHistory();
		stubs.pathSep.value( '\\' );

		const manualTestScriptsPatterns = [
			'ckeditor5-build-classic/tests/**/*.js'
		];

		stubs.glob.onFirstCall().returns( [
			'ckeditor5-build-classic\\tests\\manual\\ckeditor.js'
		] );

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: manualTestScriptsPatterns,
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: null
		} ).then( () => {
			expect( stubs.getRelativeFilePath.calledOnce ).to.equal( true );
			expect( stubs.getRelativeFilePath.firstCall.args[ 0 ] )
				.to.equal( 'ckeditor5-build-classic\\tests\\manual\\ckeditor.js' );
		} );
	} );

	it( 'should pass identity file to webpack configuration factory', () => {
		stubs.glob.returns( [ 'ckeditor5-foo/manual/file1', 'ckeditor5-foo/manual/file2' ] );
		const identityFile = '/foo/bar.js';

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: [ 'manualTestPattern' ],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			identityFile,
			disableWatch: false
		} ).then( () => {
			expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

			sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
				buildDir: 'buildDir',
				themePath: 'path/to/theme',
				language: 'en',
				onTestCompilationStatus: stubs.onTestCompilationStatus,
				additionalLanguages: [ 'pl', 'ar' ],
				entries: {
					'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1',
					'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2'
				},
				debug: [ 'CK_DEBUG' ],
				identityFile,
				disableWatch: false
			} );

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

	it( 'should pass the "disableWatch" option to webpack configuration factory', () => {
		stubs.glob.returns( [ 'ckeditor5-foo/manual/file1' ] );

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: [ 'manualTestPattern' ],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: true
		} ).then( () => {
			expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

			sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
				buildDir: 'buildDir',
				themePath: 'path/to/theme',
				language: 'en',
				onTestCompilationStatus: stubs.onTestCompilationStatus,
				additionalLanguages: [ 'pl', 'ar' ],
				entries: {
					'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1'
				},
				debug: [ 'CK_DEBUG' ],
				identityFile: undefined,
				disableWatch: true
			} );

			expect( stubs.webpack.calledOnce ).to.equal( true );
			expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.equal( {
				buildDir: 'buildDir',
				entries: {
					'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1'
				}
			} );

			expect( stubs.glob.calledOnce ).to.equal( true );
			expect( stubs.glob.firstCall.args[ 0 ] ).to.equal( 'manualTestPattern' );
		} );
	} );

	it( 'should pass correct entries object to the webpack for both JS and TS files', () => {
		stubs.glob.returns( [
			'ckeditor5-foo/manual/file1.js',
			'ckeditor5-foo/manual/file2.ts'
		] );

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: [ 'manualTestPattern' ],
			themePath: 'path/to/theme',
			language: 'en',
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: false
		} ).then( () => {
			expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

			expect( stubs.getWebpackConfig.firstCall.args[ 0 ] ).to.deep.include( {
				entries: {
					'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js',
					'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2.ts'
				}
			} );

			expect( stubs.webpack.calledOnce ).to.equal( true );
			expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.include( {
				entries: {
					'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js',
					'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2.ts'
				}
			} );
		} );
	} );
} );
