/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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

	it( 'should compile manual test scripts (DLL only)', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1-dll.js',
				'ckeditor5-foo/manual/file2-dll.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: false
		} );

		expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

		sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
			cwd: 'workspace',
			requireDll: true,
			buildDir: 'buildDir',
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			entries: {
				'ckeditor5-foo/manual/file1-dll': 'ckeditor5-foo/manual/file1-dll.js',
				'ckeditor5-foo/manual/file2-dll': 'ckeditor5-foo/manual/file2-dll.js'
			},
			debug: [ 'CK_DEBUG' ],
			disableWatch: false,
			identityFile: undefined,
			tsconfig: undefined
		} );

		expect( stubs.webpack.calledOnce ).to.equal( true );
		expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.equal( {
			buildDir: 'buildDir',
			entries: {
				'ckeditor5-foo/manual/file1-dll': 'ckeditor5-foo/manual/file1-dll.js',
				'ckeditor5-foo/manual/file2-dll': 'ckeditor5-foo/manual/file2-dll.js'
			}
		} );
	} );

	it( 'should compile manual test scripts (non-DLL only)', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: false
		} );

		expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

		sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
			cwd: 'workspace',
			requireDll: false,
			buildDir: 'buildDir',
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2.js'
			},
			debug: [ 'CK_DEBUG' ],
			disableWatch: false,
			identityFile: undefined,
			tsconfig: undefined
		} );

		expect( stubs.webpack.calledOnce ).to.equal( true );
		expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.equal( {
			buildDir: 'buildDir',
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2.js'
			}
		} );
	} );

	it( 'should compile manual test scripts (DLL and non-DLL)', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2-dll.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: false
		} );

		expect( stubs.getWebpackConfig.calledTwice ).to.equal( true );

		sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
			cwd: 'workspace',
			requireDll: true,
			buildDir: 'buildDir',
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			entries: {
				'ckeditor5-foo/manual/file2-dll': 'ckeditor5-foo/manual/file2-dll.js'
			},
			debug: [ 'CK_DEBUG' ],
			disableWatch: false,
			identityFile: undefined,
			tsconfig: undefined
		} );

		sinon.assert.calledWith( stubs.getWebpackConfig.secondCall, {
			cwd: 'workspace',
			requireDll: false,
			buildDir: 'buildDir',
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js'
			},
			debug: [ 'CK_DEBUG' ],
			disableWatch: false,
			identityFile: undefined,
			tsconfig: undefined
		} );

		expect( stubs.webpack.calledTwice ).to.equal( true );

		expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.equal( {
			buildDir: 'buildDir',
			entries: {
				'ckeditor5-foo/manual/file2-dll': 'ckeditor5-foo/manual/file2-dll.js'
			}
		} );

		expect( stubs.webpack.secondCall.args[ 0 ] ).to.deep.equal( {
			buildDir: 'buildDir',
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js'
			}
		} );
	} );

	it( 'should compile multiple manual test scripts', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-build-classic/tests/manual/ckeditor.js',
				'ckeditor5-build-classic/tests/manual/ckeditor.compcat.js',
				'ckeditor5-editor-classic/tests/manual/classic.js'
			],
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: null,
			tsconfig: undefined
		} );

		expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

		expect( stubs.getRelativeFilePath.calledThrice ).to.equal( true );
		expect( stubs.getRelativeFilePath.firstCall.args[ 0 ] )
			.to.equal( 'ckeditor5-build-classic/tests/manual/ckeditor.js' );
		expect( stubs.getRelativeFilePath.secondCall.args[ 0 ] )
			.to.equal( 'ckeditor5-build-classic/tests/manual/ckeditor.compcat.js' );
		expect( stubs.getRelativeFilePath.thirdCall.args[ 0 ] )
			.to.equal( 'ckeditor5-editor-classic/tests/manual/classic.js' );
	} );

	it( 'rejects if webpack threw an error', () => {
		webpackError = new Error( 'Unexpected error.' );

		return compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2.js'
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

	it( 'works on Windows environments', async () => {
		await compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-build-classic\\tests\\manual\\ckeditor.js'
			],
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: null
		} );

		expect( stubs.getRelativeFilePath.calledOnce ).to.equal( true );
		expect( stubs.getRelativeFilePath.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-build-classic\\tests\\manual\\ckeditor.js' );
	} );

	it( 'should pass identity file to webpack configuration factory', async () => {
		const identityFile = '/foo/bar.js';

		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			identityFile,
			disableWatch: false
		} );

		expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

		sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
			cwd: 'workspace',
			requireDll: false,
			buildDir: 'buildDir',
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2.js'
			},
			debug: [ 'CK_DEBUG' ],
			identityFile,
			disableWatch: false,
			tsconfig: undefined
		} );

		expect( stubs.webpack.calledOnce ).to.equal( true );
		expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.equal( {
			buildDir: 'buildDir',
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2.js'
			}
		} );
	} );

	it( 'should pass the "disableWatch" option to webpack configuration factory', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: true
		} );

		expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

		sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
			cwd: 'workspace',
			requireDll: false,
			buildDir: 'buildDir',
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js'
			},
			debug: [ 'CK_DEBUG' ],
			identityFile: undefined,
			disableWatch: true,
			tsconfig: undefined
		} );

		expect( stubs.webpack.calledOnce ).to.equal( true );
		expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.equal( {
			buildDir: 'buildDir',
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js'
			}
		} );
	} );

	it( 'should pass the "tsconfig" option to webpack configuration factory', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			tsconfig: '/absolute/path/to/tsconfig.json'
		} );

		expect( stubs.getWebpackConfig.calledOnce ).to.equal( true );

		sinon.assert.calledWith( stubs.getWebpackConfig.firstCall, {
			cwd: 'workspace',
			requireDll: false,
			buildDir: 'buildDir',
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: stubs.onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js'
			},
			debug: [ 'CK_DEBUG' ],
			identityFile: undefined,
			disableWatch: undefined,
			tsconfig: '/absolute/path/to/tsconfig.json'
		} );

		expect( stubs.webpack.calledOnce ).to.equal( true );
		expect( stubs.webpack.firstCall.args[ 0 ] ).to.deep.equal( {
			buildDir: 'buildDir',
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js'
			}
		} );
	} );
} );
