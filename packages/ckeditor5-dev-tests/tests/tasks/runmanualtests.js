/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;

describe( 'runManualTests', () => {
	let sandbox, spies, runManualTests;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		spies = {
			server: sandbox.spy( () => Promise.resolve() ),
			htmlFileCompiler: sandbox.spy( () => Promise.resolve() ),
			scriptCompiler: sandbox.spy( () => Promise.resolve() ),
			removeDir: sandbox.spy( () => Promise.resolve() ),
			copyAssets: sandbox.spy(),
			transformFileOptionToTestGlob: sandbox.stub()
		};

		mockery.registerMock( '../utils/manual-tests/createserver', spies.server );
		mockery.registerMock( '../utils/manual-tests/compilehtmlfiles', spies.htmlFileCompiler );
		mockery.registerMock( '../utils/manual-tests/compilescripts', spies.scriptCompiler );
		mockery.registerMock( '../utils/manual-tests/removedir', spies.removeDir );
		mockery.registerMock( '../utils/manual-tests/copyassets', spies.copyAssets );
		mockery.registerMock( '../utils/transformfileoptiontotestglob', spies.transformFileOptionToTestGlob );

		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd' ).returns( 'workspace' );

		runManualTests = require( '../../lib/tasks/runmanualtests' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should run all manual tests and return promise', () => {
		spies.transformFileOptionToTestGlob.returns( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		return runManualTests( {} )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.transformFileOptionToTestGlob.calledOnce ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( '*' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				expect( spies.htmlFileCompiler.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'workspace/build/.manual-tests',
					patterns: [
						'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
					],
					language: undefined,
					additionalLanguages: undefined
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'workspace/build/.manual-tests',
					patterns: [
						'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
					],
					themePath: null,
					language: undefined,
					additionalLanguages: undefined,
					debug: undefined,
					identityFile: null
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'runs specified manual tests', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [
			'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-build-classic/tests/**/manual/**/*.js'
		] );

		spies.transformFileOptionToTestGlob.onSecondCall().returns( [
			'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
			'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
		] );

		const options = {
			files: [
				'build-classic',
				'editor-classic/manual/classic.js'
			],
			themePath: 'path/to/theme',
			debug: [ 'CK_DEBUG' ]
		};

		return runManualTests( options )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.transformFileOptionToTestGlob.calledTwice ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( 'build-classic' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 0 ] )
					.to.equal( 'editor-classic/manual/classic.js' );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				expect( spies.htmlFileCompiler.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'workspace/build/.manual-tests',
					patterns: [
						'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
						'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
					],
					language: undefined,
					additionalLanguages: undefined
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'workspace/build/.manual-tests',
					patterns: [
						'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
						'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
					],
					themePath: 'path/to/theme',
					language: undefined,
					additionalLanguages: undefined,
					debug: [ 'CK_DEBUG' ],
					identityFile: null
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'allows specifying language and additionalLanguages (to CKEditorWebpackPlugin)', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [
			'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor4-build-classic/tests/**/manual/**/*.js'
		] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [
			'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
			'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
		] );

		const options = {
			files: [
				'build-classic',
				'editor-classic/manual/classic.js'
			],
			themePath: 'path/to/theme',
			language: 'pl',
			additionalLanguages: [
				'ar',
				'en'
			],
			debug: [ 'CK_DEBUG' ]
		};

		return runManualTests( options )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.transformFileOptionToTestGlob.calledTwice ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( 'build-classic' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 0 ] )
					.to.equal( 'editor-classic/manual/classic.js' );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				expect( spies.htmlFileCompiler.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'workspace/build/.manual-tests',
					patterns: [
						'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor4-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
						'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
					],
					language: 'pl',
					additionalLanguages: [ 'ar', 'en' ]
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'workspace/build/.manual-tests',
					patterns: [
						'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor4-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
						'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
					],
					themePath: 'path/to/theme',
					language: 'pl',
					additionalLanguages: [ 'ar', 'en' ],
					debug: [ 'CK_DEBUG' ],
					identityFile: null
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'allows specifying port', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [
			'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor4-build-classic/tests/**/manual/**/*.js'
		] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [
			'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
			'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
		] );

		const options = {
			files: [
				'build-classic',
				'editor-classic/manual/classic.js'
			],
			port: 8888
		};

		return runManualTests( options )
			.then( () => {
				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.server.firstCall.args[ 1 ] ).to.equal( 8888 );
			} );
	} );

	it( 'allows specifying identity file (absolute path)', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [
			'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor4-build-classic/tests/**/manual/**/*.js'
		] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [
			'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
			'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
		] );

		const options = {
			files: [
				'build-classic',
				'editor-classic/manual/classic.js'
			],
			identityFile: '/absolute/path/to/secrets.js'
		};

		return runManualTests( options )
			.then( () => {
				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'workspace/build/.manual-tests',
					patterns: [
						'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor4-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
						'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
					],
					themePath: null,
					language: undefined,
					debug: undefined,
					additionalLanguages: undefined,
					identityFile: '/absolute/path/to/secrets.js'
				} );
			} );
	} );

	it( 'allows specifying identity file (relative path)', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [
			'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor4-build-classic/tests/**/manual/**/*.js'
		] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [
			'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
			'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
		] );

		const options = {
			files: [
				'build-classic',
				'editor-classic/manual/classic.js'
			],
			identityFile: 'path/to/secrets.js'
		};

		return runManualTests( options )
			.then( () => {
				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.deep.equal( {
					buildDir: 'workspace/build/.manual-tests',
					patterns: [
						'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor4-build-classic/tests/**/manual/**/*.js',
						'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js',
						'workspace/packages/ckeditor-editor-classic/tests/manual/**/*.js'
					],
					themePath: null,
					language: undefined,
					debug: undefined,
					additionalLanguages: undefined,
					identityFile: 'workspace/path/to/secrets.js'
				} );
			} );
	} );
} );
