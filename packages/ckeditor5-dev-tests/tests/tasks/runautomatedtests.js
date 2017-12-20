/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const expect = require( 'chai' ).expect;

describe( 'runAutomatedTests', () => {
	let sandbox, stubs, runAutomatedTests, karmaServerCallback;

	beforeEach( () => {
		karmaServerCallback = null;
		sandbox = sinon.sandbox.create();

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
			]
		};

		stubs.transformFileOptionToTestGlob.returns( '/workspace/packages/ckeditor5-basic-styles/tests/**/*.js' );

		stubs.glob.sync.returns( [
			'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
			'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
		] );

		const expectedEntryPointContent = [
			'import "/workspace/packages/ckeditor5-basic-styles/tests/bold.js";',
			'import "/workspace/packages/ckeditor5-basic-styles/tests/italic.js";',
			''
		].join( '\n' );

		// Timeout simulates a Karma's work.
		setTimeout( () => {
			karmaServerCallback( 0 );
		}, 1000 );

		runAutomatedTests( options )
			.then( () => {
				expect( stubs.mkdirp.sync.calledOnce ).to.equal( true );
				expect( stubs.mkdirp.sync.firstCall.args[ 0 ] ).to.equal( '/workspace/build/.automated-tests' );

				expect( stubs.fs.writeFileSync.calledOnce ).to.equal( true );
				expect( stubs.fs.writeFileSync.firstCall.args[ 0 ] ).to.equal( '/workspace/build/.automated-tests/entry-point.js' );
				expect( stubs.fs.writeFileSync.firstCall.args[ 1 ] ).to.equal( expectedEntryPointContent );

				done();
			} );
	} );

	it( 'throws when files are not specified', () => {
		return runAutomatedTests( {} )
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
			]
		};

		stubs.transformFileOptionToTestGlob.onFirstCall().returns( '/workspace/packages/ckeditor5-basic-foo/tests/**/*.js' );
		stubs.transformFileOptionToTestGlob.onSecondCall().returns( '/workspace/packages/ckeditor5-bar-core/tests/**/*.js' );

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
} );
