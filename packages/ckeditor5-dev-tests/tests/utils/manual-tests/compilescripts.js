/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );

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
			webpack: sandbox.spy( ( config, callback ) => {
				callback( webpackError );
			} ),
			getWebpackConfig: sandbox.spy( ( { entries, buildDir } ) => ( {
				entries,
				buildDir
			} ) ),
			getRelativeFilePath: sandbox.spy( x => x ),
			onTestCompilationStatus: sinon.stub()
		};

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
		return compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1',
				'ckeditor5-foo/manual/file2'
			],
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
		} );
	} );

	it( 'should compile multiple manual test scripts', () => {
		return compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-build-classic/tests/manual/ckeditor.js',
				'ckeditor5-build-classic/tests/manual/ckeditor.compcat.js',
				'ckeditor5-editor-classic/tests/manual/classic.js'
			],
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: null
		} ).then( () => {
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

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1',
				'ckeditor5-foo/manual/file2'
			],
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

	it( 'works on Windows environments', () => {
		return compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-build-classic\\tests\\manual\\ckeditor.js'
			],
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
		const identityFile = '/foo/bar.js';

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1',
				'ckeditor5-foo/manual/file2'
			],
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
		} );
	} );

	it( 'should pass the "disableWatch" option to webpack configuration factory', () => {
		return compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1'
			],
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
		} );
	} );
} );
