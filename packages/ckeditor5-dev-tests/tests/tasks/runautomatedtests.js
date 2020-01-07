/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const expect = require( 'chai' ).expect;
const chalk = require( 'chalk' );

describe( 'runAutomatedTests', () => {
	let sandbox, stubs, runAutomatedTests, karmaServerCallback;

	const codeMakingConsoleUseThrowErrors = `
const originalWarn = console.warn;

window.production = true;

beforeEach( () => {
	Object.keys( console )
		.filter( methodOrProperty => typeof console[ methodOrProperty ] === 'function' )
		.forEach( method => {
			console[ method ] = ( ...data ) => {
				originalWarn( 'Detected \`console.' + method + '()\`:', ...data );
				throw new Error( 'Detected \`console.' + method + '()\`:' );
			}
		} );
} );
	`;

	beforeEach( () => {
		karmaServerCallback = null;
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			fs: {
				writeFileSync: sandbox.stub(),
				utimesSync: sandbox.stub(),
			},
			log: {
				info: sandbox.stub(),
				warn: sandbox.stub(),
				error: sandbox.stub()
			},
			mkdirp: {
				sync: sandbox.stub()
			},
			glob: {
				sync: sandbox.stub()
			},
			karma: {
				Server: class KarmaServer {
					constructor( config, callback ) {
						karmaServerCallback = callback;
					}

					on( ...args ) {
						return stubs.karma.karmaServerOn( ...args );
					}

					start( ...args ) {
						return stubs.karma.karmaServerOn( ...args );
					}
				},
				karmaServerOn: sandbox.stub(),
				karmaServerStart: sandbox.stub()
			},
			getKarmaConfig: sandbox.stub(),
			transformFileOptionToTestGlob: sandbox.stub(),
		};

		sandbox.stub( process, 'cwd' ).returns( '/workspace' );

		mockery.registerMock( 'mkdirp', stubs.mkdirp );
		mockery.registerMock( 'karma', stubs.karma );
		mockery.registerMock( 'karma/lib/logger.js', {
			setupFromConfig: sandbox.spy(),
			create( name ) {
				expect( name ).to.equal( 'config' );
				return stubs.log;
			}
		} );
		mockery.registerMock( '../utils/automated-tests/getkarmaconfig', stubs.getKarmaConfig );
		mockery.registerMock( '../utils/transformfileoptiontotestglob', stubs.transformFileOptionToTestGlob );

		runAutomatedTests = proxyquire( '../../lib/tasks/runautomatedtests', {
			fs: stubs.fs,
			glob: stubs.glob,
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should create an entry file before tests execution', done => {
		const options = {
			files: [
				'basic-styles'
			],
			production: true
		};

		stubs.transformFileOptionToTestGlob.returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		stubs.glob.sync.onFirstCall().returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
			'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
		] );

		stubs.glob.sync.onSecondCall().returns( [] );

		const expectedEntryPointContent = [
			'import "/workspace/packages/ckeditor5-basic-styles/tests/bold.js";',
			'import "/workspace/packages/ckeditor5-basic-styles/tests/italic.js";',
			''
		].join( '\n' );

		setTimeout( () => {
			karmaServerCallback( 0 );
		} );

		runAutomatedTests( options )
			.then( () => {
				expect( stubs.mkdirp.sync.calledOnce ).to.equal( true );
				expect( stubs.mkdirp.sync.firstCall.args[ 0 ] ).to.equal( '/workspace/build/.automated-tests' );

				expect( stubs.fs.writeFileSync.calledOnce ).to.equal( true );
				expect( stubs.fs.writeFileSync.firstCall.args[ 0 ] ).to.equal( '/workspace/build/.automated-tests/entry-point.js' );
				expect( stubs.fs.writeFileSync.firstCall.args[ 1 ] ).to.include( expectedEntryPointContent );

				done();
			} );
	} );

	it( 'throws when files are not specified', () => {
		return runAutomatedTests( { production: true } )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				err => {
					expect( err.message ).to.equal( 'Karma requires files to tests. `options.files` has to be non-empty array.' );
				}
			);
	} );

	it( 'throws when specified files are invalid', () => {
		const options = {
			files: [
				'basic-foo',
				'bar-core',
			],
			production: true
		};

		stubs.transformFileOptionToTestGlob.onFirstCall().returns( [
			'/workspace/packages/ckeditor5-basic-foo/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-foo/tests/**/*.js',
		] );

		stubs.transformFileOptionToTestGlob.onSecondCall().returns( [
			'/workspace/packages/ckeditor5-bar-core/tests/**/*.js',
			'/workspace/packages/ckeditor-bar-core/tests/**/*.js'
		] );

		stubs.glob.sync.returns( [] );

		return runAutomatedTests( options )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				err => {
					expect( stubs.log.warn.calledTwice ).to.equal( true );
					expect( stubs.log.warn.firstCall.args[ 0 ] ).to.equal( 'Pattern "%s" does not match any file.' );
					expect( stubs.log.warn.firstCall.args[ 1 ] ).to.equal( 'basic-foo' );
					expect( stubs.log.warn.secondCall.args[ 0 ] ).to.equal( 'Pattern "%s" does not match any file.' );
					expect( stubs.log.warn.secondCall.args[ 1 ] ).to.equal( 'bar-core' );

					expect( err.message ).to.equal( 'Not found files to tests. Specified patterns are invalid.' );
				}
			);
	} );

	it( 'should warn when the `production` option is set to `false`', () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: false
		};

		const consoleWarnStub = sandbox.stub( console, 'warn' );

		stubs.transformFileOptionToTestGlob.returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		stubs.glob.sync.onFirstCall().returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
			'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
		] );

		stubs.glob.sync.onSecondCall().returns( [] );

		setTimeout( () => {
			karmaServerCallback( 0 );
		} );

		return runAutomatedTests( options )
			.then( () => {
				sinon.assert.calledOnce( consoleWarnStub );
				sinon.assert.calledWith(
					consoleWarnStub,
					chalk.yellow( '⚠ You\'re running tests in dev mode - some error protections are loose. ' +
						'Use the `--protection` flag to use strictest verification methods.' )
				);
			} );
	} );

	it( 'should not add the code making console use throw an error when the `production` option is set to false', () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: false
		};

		sandbox.stub( console, 'warn' );

		stubs.transformFileOptionToTestGlob.returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		stubs.glob.sync.onFirstCall().returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
			'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
		] );

		stubs.glob.sync.onSecondCall().returns( [] );

		setTimeout( () => {
			karmaServerCallback( 0 );
		} );

		return runAutomatedTests( options )
			.then( () => {
				expect( stubs.fs.writeFileSync.firstCall.args[ 1 ] ).to.not.include( codeMakingConsoleUseThrowErrors );
			} );
	} );

	it( 'should add the code making console use throw an error when the `production` option is set to true', () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: true
		};

		stubs.transformFileOptionToTestGlob.returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		stubs.glob.sync.onFirstCall().returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
			'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
		] );

		stubs.glob.sync.onSecondCall().returns( [] );

		setTimeout( () => {
			karmaServerCallback( 0 );
		} );

		return runAutomatedTests( options )
			.then( () => {
				expect( stubs.fs.writeFileSync.firstCall.args[ 1 ] ).to.include( codeMakingConsoleUseThrowErrors );
			} );
	} );
} );
