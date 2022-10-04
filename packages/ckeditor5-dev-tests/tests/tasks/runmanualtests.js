/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;

describe( 'runManualTests', () => {
	let sandbox, spies, runManualTests, defaultOptions;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		spies = {
			socketIO: {
				Server: sandbox.stub().returns( new ( class {} )() )
			},
			childProcess: {
				spawn: sandbox.stub().callsFake( () => {
					// Simulate closing a new process. It does not matter that this simulation ends the child process immediately.
					// All that matters is that the `close` event is emitted with specified exit code.
					process.nextTick( () => {
						spies.childProcess.spawnTriggerEvent( 'close', spies.childProcess.spawnExitCode );
					} );

					return spies.childProcess.spawnReturnValue;
				} ),
				spawnReturnValue: {
					on: ( event, callback ) => {
						if ( !spies.childProcess.spawnEvents[ event ] ) {
							spies.childProcess.spawnEvents[ event ] = [];
						}

						spies.childProcess.spawnEvents[ event ].push( callback );

						// Return the same object containing the `on()` method to allow method chaining: `.on( ... ).on( ... )`.
						return spies.childProcess.spawnReturnValue;
					}
				},
				spawnExitCode: 0,
				spawnEvents: {},
				spawnTriggerEvent: ( event, data ) => {
					if ( spies.childProcess.spawnEvents[ event ] ) {
						for ( const callback of spies.childProcess.spawnEvents[ event ] ) {
							callback( data );
						}

						delete spies.childProcess.spawnEvents[ event ];
					}
				}
			},
			inquirer: {
				prompt: sandbox.stub()
			},
			glob: {
				sync: sandbox.stub().callsFake( pattern => {
					const patterns = {
						// Valid pattern for manual tests.
						'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js': [
							'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
							'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js'
						],
						// Another valid pattern for manual tests.
						'workspace/packages/ckeditor-*/tests/**/manual/**/*.js': [
							'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
							'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
						],
						// Invalid pattern for manual tests (points to `/_utils/` subdirectory).
						'workspace/packages/ckeditor-*/tests/**/manual/_utils/**/*.js': [
							'workspace/packages/ckeditor-foo/tests/manual/_utils/feature-e.js',
							'workspace/packages/ckeditor-bar/tests/manual/_utils/feature-f.js'
						],
						// Invalid pattern for manual tests (points outside manual test directory).
						'workspace/packages/ckeditor-*/tests/**/outside/**/*.js': [
							'workspace/packages/ckeditor-foo/tests/outside/feature-g.js',
							'workspace/packages/ckeditor-bar/tests/outside/feature-h.js'
						],
						// Valid pattern for manual tests that require DLLs.
						'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js': [
							'workspace/packages/ckeditor5-foo/tests/manual/dll/feature-i-dll.js',
							'workspace/packages/ckeditor5-bar/tests/manual/dll/feature-j-dll.js'
						],
						// Pattern for finding `package.json` in all repositories.
						// External repositories are first, then the root repository.
						'{,external/*/}package.json': [
							'workspace/ckeditor5/external/ckeditor5-internal/package.json',
							'workspace/ckeditor5/external/collaboration-features/package.json',
							'workspace/ckeditor5/package.json'
						]
					};

					return patterns[ pattern ] || [];
				} )
			},
			chalk: {
				bold: sandbox.stub().callsFake( msg => msg )
			},
			fs: {
				readFileSync: sandbox.stub()
			},
			path: {
				join: sandbox.stub().callsFake( ( ...chunks ) => chunks.join( '/' ) ),
				resolve: sandbox.stub().callsFake( path => '/absolute/path/to/' + path ),
				basename: sandbox.stub().callsFake( path => path.split( /[\\/]/ ).pop() ),
				dirname: sandbox.stub().callsFake( path => {
					const chunks = path.split( /[\\/]/ );

					chunks.pop();

					return chunks.join( '/' );
				} )
			},
			devUtils: {
				logger: sandbox.stub().callsFake( () => ( {
					warning: spies.devUtils.logWarning,
					info: spies.devUtils.logInfo
				} ) ),
				logWarning: sandbox.stub(),
				logInfo: sandbox.stub()
			},
			isInteractive: sandbox.stub(),
			server: sandbox.stub(),
			htmlFileCompiler: sandbox.spy( () => Promise.resolve() ),
			scriptCompiler: sandbox.spy( () => Promise.resolve() ),
			removeDir: sandbox.spy( () => Promise.resolve() ),
			copyAssets: sandbox.spy(),
			transformFileOptionToTestGlob: sandbox.stub()
		};

		mockery.registerMock( 'socket.io', spies.socketIO );
		mockery.registerMock( 'child_process', spies.childProcess );
		mockery.registerMock( 'inquirer', spies.inquirer );
		mockery.registerMock( 'glob', spies.glob );
		mockery.registerMock( 'chalk', spies.chalk );
		mockery.registerMock( 'path', spies.path );
		mockery.registerMock( 'fs', spies.fs );
		mockery.registerMock( 'is-interactive', spies.isInteractive );
		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', spies.devUtils );
		mockery.registerMock( '../utils/manual-tests/createserver', spies.server );
		mockery.registerMock( '../utils/manual-tests/compilehtmlfiles', spies.htmlFileCompiler );
		mockery.registerMock( '../utils/manual-tests/compilescripts', spies.scriptCompiler );
		mockery.registerMock( '../utils/manual-tests/removedir', spies.removeDir );
		mockery.registerMock( '../utils/manual-tests/copyassets', spies.copyAssets );
		mockery.registerMock( '../utils/transformfileoptiontotestglob', spies.transformFileOptionToTestGlob );

		sandbox.stub( process, 'cwd' ).returns( 'workspace' );

		// There is some platform-specific logic in the `lib/utils/glob.js`.
		sandbox.stub( process, 'platform' ).value( 'linux' );

		defaultOptions = {
			dll: null
		};

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

		return runManualTests( defaultOptions )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.transformFileOptionToTestGlob.calledOnce ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( '*' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.htmlFileCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					disableWatch: false,
					silent: false
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					themePath: null,
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					debug: undefined,
					disableWatch: false,
					identityFile: undefined
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'runs specified manual tests', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			themePath: 'path/to/theme',
			debug: [ 'CK_DEBUG' ]
		};

		return runManualTests( { ...defaultOptions, ...options } )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.transformFileOptionToTestGlob.calledTwice ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-classic' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 0 ] ).to.equal( 'ckeditor-classic/manual/classic.js' );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.htmlFileCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					disableWatch: false,
					silent: false
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					themePath: 'path/to/theme',
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					debug: [ 'CK_DEBUG' ],
					disableWatch: false,
					identityFile: undefined
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'allows specifying language and additionalLanguages (to CKEditorWebpackPlugin)', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			themePath: 'path/to/theme',
			language: 'pl',
			additionalLanguages: [
				'ar',
				'en'
			],
			debug: [ 'CK_DEBUG' ]
		};

		return runManualTests( { ...defaultOptions, ...options } )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.transformFileOptionToTestGlob.calledTwice ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-classic' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 0 ] ).to.equal( 'ckeditor-classic/manual/classic.js' );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.htmlFileCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					language: 'pl',
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: [ 'ar', 'en' ],
					disableWatch: false,
					silent: false
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					themePath: 'path/to/theme',
					language: 'pl',
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: [ 'ar', 'en' ],
					debug: [ 'CK_DEBUG' ],
					disableWatch: false,
					identityFile: undefined
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'allows specifying port', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			port: 8888
		};

		return runManualTests( { ...defaultOptions, ...options } )
			.then( () => {
				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.server.firstCall.args[ 1 ] ).to.equal( 8888 );
			} );
	} );

	it( 'allows specifying identity file (absolute path)', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			identityFile: '/absolute/path/to/secrets.js'
		};

		return runManualTests( { ...defaultOptions, ...options } )
			.then( () => {
				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					themePath: null,
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					debug: undefined,
					additionalLanguages: undefined,
					disableWatch: false,
					identityFile: '/absolute/path/to/secrets.js'
				} );
			} );
	} );

	it( 'allows specifying identity file (relative path)', () => {
		spies.transformFileOptionToTestGlob.onFirstCall().returns( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			identityFile: 'path/to/secrets.js'
		};

		return runManualTests( { ...defaultOptions, ...options } )
			.then( () => {
				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					themePath: null,
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					debug: undefined,
					additionalLanguages: undefined,
					disableWatch: false,
					identityFile: 'path/to/secrets.js'
				} );
			} );
	} );

	it( 'should allow hiding processed files in the console', () => {
		spies.transformFileOptionToTestGlob.returns( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		const options = {
			silent: true
		};

		return runManualTests( { ...defaultOptions, ...options } )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.removeDir.firstCall.args[ 1 ] ).to.deep.equal( { silent: true } );

				expect( spies.transformFileOptionToTestGlob.calledOnce ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( '*' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.htmlFileCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					disableWatch: false,
					silent: true
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					themePath: null,
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					debug: undefined,
					disableWatch: false,
					identityFile: undefined
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'should allow disabling listening for changes in source files', () => {
		spies.transformFileOptionToTestGlob.returns( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		const options = {
			disableWatch: true
		};

		return runManualTests( { ...defaultOptions, ...options } )
			.then( () => {
				expect( spies.transformFileOptionToTestGlob.calledOnce ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( '*' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.htmlFileCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					disableWatch: true,
					silent: false
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
						'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					themePath: null,
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					debug: undefined,
					disableWatch: true,
					identityFile: undefined
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'compiles only manual test files (ignores utils and files outside the manual directory)', () => {
		spies.transformFileOptionToTestGlob.returns( [
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/_utils/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/outside/**/*.js'
		] );

		const options = {
			disableWatch: true
		};

		return runManualTests( { ...defaultOptions, ...options } )
			.then( () => {
				expect( spies.transformFileOptionToTestGlob.calledOnce ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( '*' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.htmlFileCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					disableWatch: true,
					silent: false
				} );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
					buildDir: 'workspace/build/.manual-tests',
					sourceFiles: [
						'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
						'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
					],
					themePath: null,
					language: undefined,
					onTestCompilationStatus: sinon.match.func,
					additionalLanguages: undefined,
					debug: undefined,
					disableWatch: true,
					identityFile: undefined
				} );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'should start a socket.io server as soon as the http server is up and running', () => {
		spies.transformFileOptionToTestGlob.returns( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		const httpServerMock = sinon.spy();

		spies.server.callsFake( ( buildDire, port, onCreate ) => onCreate( httpServerMock ) );

		return runManualTests( defaultOptions )
			.then( () => {
				sinon.assert.calledOnce( spies.socketIO.Server );
				sinon.assert.calledWithExactly( spies.socketIO.Server, httpServerMock );
			} );
	} );

	describe( 'DLLs', () => {
		it( 'should not build the DLLs if there are no DLL-related manual tests', () => {
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.notCalled( spies.childProcess.spawn );
					sinon.assert.notCalled( spies.devUtils.logInfo );
					sinon.assert.notCalled( spies.devUtils.logWarning );
					sinon.assert.notCalled( spies.inquirer.prompt );
					sinon.assert.notCalled( spies.path.resolve );
					sinon.assert.notCalled( spies.fs.readFileSync );
				} );
		} );

		it( 'should not build the DLLs if the console is not interactive', () => {
			spies.isInteractive.returns( false );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.notCalled( spies.childProcess.spawn );
					sinon.assert.notCalled( spies.devUtils.logInfo );
					sinon.assert.notCalled( spies.devUtils.logWarning );
					sinon.assert.notCalled( spies.inquirer.prompt );
					sinon.assert.notCalled( spies.path.resolve );
					sinon.assert.notCalled( spies.fs.readFileSync );
				} );
		} );

		it( 'should not build the DLLs and not ask user if `--dll` flag is `false`, even if console is interactive', () => {
			spies.isInteractive.returns( true );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			const options = {
				dll: false
			};

			return runManualTests( { ...defaultOptions, ...options } )
				.then( () => {
					sinon.assert.notCalled( spies.childProcess.spawn );
					sinon.assert.notCalled( spies.devUtils.logInfo );
					sinon.assert.notCalled( spies.devUtils.logWarning );
					sinon.assert.notCalled( spies.inquirer.prompt );
					sinon.assert.notCalled( spies.path.resolve );
					sinon.assert.notCalled( spies.fs.readFileSync );
				} );
		} );

		it( 'should not build the DLLs if user declined the question', () => {
			spies.isInteractive.returns( true );
			spies.inquirer.prompt.resolves( { confirm: false } );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.notCalled( spies.childProcess.spawn );

					sinon.assert.calledOnce( spies.devUtils.logWarning );
					sinon.assert.calledWith( spies.devUtils.logWarning.firstCall,
						'\n⚠ Some tests require DLL builds.\n'
					);

					sinon.assert.calledTwice( spies.devUtils.logInfo );
					sinon.assert.calledWith( spies.devUtils.logInfo.firstCall,
						'You don\'t have to update these builds every time unless you want to check changes in DLL tests.'
					);
					sinon.assert.calledWith( spies.devUtils.logInfo.secondCall,
						'You can use the following flags to skip this prompt in the future: --dll / --no-dll.\n'
					);

					sinon.assert.calledOnce( spies.inquirer.prompt );
					sinon.assert.calledWith( spies.inquirer.prompt.firstCall, [ {
						message: 'Create the DLL builds now?',
						type: 'confirm',
						name: 'confirm',
						default: false
					} ] );

					sinon.assert.notCalled( spies.path.resolve );
					sinon.assert.notCalled( spies.fs.readFileSync );
				} );
		} );

		it( 'should open the package.json in each repository in proper order (root repository first, then external ones)', () => {
			spies.isInteractive.returns( true );
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync.returns( JSON.stringify( {
				name: 'ckeditor5-example-package'
			} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.notCalled( spies.childProcess.spawn );

					sinon.assert.calledOnce( spies.devUtils.logWarning );
					sinon.assert.calledWith( spies.devUtils.logWarning.firstCall,
						'\n⚠ Some tests require DLL builds.\n'
					);

					sinon.assert.calledTwice( spies.devUtils.logInfo );
					sinon.assert.calledWith( spies.devUtils.logInfo.firstCall,
						'You don\'t have to update these builds every time unless you want to check changes in DLL tests.'
					);
					sinon.assert.calledWith( spies.devUtils.logInfo.secondCall,
						'You can use the following flags to skip this prompt in the future: --dll / --no-dll.\n'
					);

					sinon.assert.calledOnce( spies.inquirer.prompt );
					sinon.assert.calledWith( spies.inquirer.prompt.firstCall, [ {
						message: 'Create the DLL builds now?',
						type: 'confirm',
						name: 'confirm',
						default: false
					} ] );

					// The `path.resolve()` calls are not sorted, so it is called in the same order as data returned from `glob`.
					sinon.assert.calledThrice( spies.path.resolve );
					sinon.assert.calledWith( spies.path.resolve.firstCall,
						'workspace/ckeditor5/external/ckeditor5-internal/package.json'
					);
					sinon.assert.calledWith( spies.path.resolve.secondCall,
						'workspace/ckeditor5/external/collaboration-features/package.json'
					);
					sinon.assert.calledWith( spies.path.resolve.thirdCall,
						'workspace/ckeditor5/package.json'
					);

					// The `fs.readFileSync()` calls are sorted: root repository first, then external ones.
					sinon.assert.calledThrice( spies.fs.readFileSync );
					sinon.assert.calledWith( spies.fs.readFileSync.firstCall,
						'/absolute/path/to/workspace/ckeditor5/package.json'
					);
					sinon.assert.calledWith( spies.fs.readFileSync.secondCall,
						'/absolute/path/to/workspace/ckeditor5/external/ckeditor5-internal/package.json'
					);
					sinon.assert.calledWith( spies.fs.readFileSync.thirdCall,
						'/absolute/path/to/workspace/ckeditor5/external/collaboration-features/package.json'
					);
				} );
		} );

		it( 'should not build the DLLs if no repository has scripts in package.json', () => {
			spies.isInteractive.returns( true );
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync.returns( JSON.stringify( {
				name: 'ckeditor5-example-package'
			} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.notCalled( spies.childProcess.spawn );
				} );
		} );

		it( 'should not build the DLLs if no repository has script to build DLLs in package.json', () => {
			spies.isInteractive.returns( true );
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync.returns( JSON.stringify( {
				name: 'ckeditor5-example-package',
				scripts: {
					'build': 'node ./scripts/build'
				}
			} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.notCalled( spies.childProcess.spawn );
				} );
		} );

		it( 'should build the DLLs in each repository that has script to build DLLs in package.json', () => {
			spies.isInteractive.returns( true );
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync
				.returns( JSON.stringify( {
					name: 'ckeditor5-example-package',
					scripts: {
						'dll:build': 'node ./scripts/build-dll'
					}
				} ) )
				.withArgs( '/absolute/path/to/workspace/ckeditor5/external/collaboration-features/package.json' )
				.returns( JSON.stringify( {
					name: 'ckeditor5-example-package',
					scripts: {
						'build': 'node ./scripts/build'
					}
				} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.calledTwice( spies.childProcess.spawn );

					sinon.assert.calledWith( spies.childProcess.spawn.firstCall,
						'yarnpkg',
						[ 'run', 'dll:build' ],
						{
							encoding: 'utf8',
							shell: true,
							cwd: '/absolute/path/to/workspace/ckeditor5',
							stdio: 'inherit'
						}
					);
					sinon.assert.calledWith( spies.childProcess.spawn.secondCall,
						'yarnpkg',
						[ 'run', 'dll:build' ],
						{
							encoding: 'utf8',
							shell: true,
							cwd: '/absolute/path/to/workspace/ckeditor5/external/ckeditor5-internal',
							stdio: 'inherit'
						}
					);

					sinon.assert.calledOnce( spies.devUtils.logWarning );
					sinon.assert.calledWith( spies.devUtils.logWarning.firstCall,
						'\n⚠ Some tests require DLL builds.\n'
					);

					sinon.assert.callCount( spies.devUtils.logInfo, 4 );
					sinon.assert.calledWith( spies.devUtils.logInfo.getCall( 0 ),
						'You don\'t have to update these builds every time unless you want to check changes in DLL tests.'
					);
					sinon.assert.calledWith( spies.devUtils.logInfo.getCall( 1 ),
						'You can use the following flags to skip this prompt in the future: --dll / --no-dll.\n'
					);
					sinon.assert.calledWith( spies.devUtils.logInfo.getCall( 2 ),
						'\n📍 Building DLLs in ckeditor5...\n'
					);
					sinon.assert.calledWith( spies.devUtils.logInfo.getCall( 3 ),
						'\n📍 Building DLLs in ckeditor5-internal...\n'
					);
				} );
		} );

		it( 'should build the DLLs automatically and not ask user if `--dll` flag is `true`, even if console is interactive', () => {
			spies.isInteractive.returns( true );
			spies.fs.readFileSync
				.returns( JSON.stringify( {
					name: 'ckeditor5-example-package',
					scripts: {
						'dll:build': 'node ./scripts/build-dll'
					}
				} ) )
				.withArgs( '/absolute/path/to/workspace/ckeditor5/external/collaboration-features/package.json' )
				.returns( JSON.stringify( {
					name: 'ckeditor5-example-package',
					scripts: {
						'build': 'node ./scripts/build'
					}
				} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			const options = {
				dll: true
			};

			return runManualTests( { ...defaultOptions, ...options } )
				.then( () => {
					sinon.assert.notCalled( spies.inquirer.prompt );

					sinon.assert.calledTwice( spies.childProcess.spawn );
					sinon.assert.calledWith( spies.childProcess.spawn.firstCall,
						'yarnpkg',
						[ 'run', 'dll:build' ],
						{
							encoding: 'utf8',
							shell: true,
							cwd: '/absolute/path/to/workspace/ckeditor5',
							stdio: 'inherit'
						}
					);
					sinon.assert.calledWith( spies.childProcess.spawn.secondCall,
						'yarnpkg',
						[ 'run', 'dll:build' ],
						{
							encoding: 'utf8',
							shell: true,
							cwd: '/absolute/path/to/workspace/ckeditor5/external/ckeditor5-internal',
							stdio: 'inherit'
						}
					);

					sinon.assert.notCalled( spies.devUtils.logWarning );

					sinon.assert.calledTwice( spies.devUtils.logInfo );
					sinon.assert.calledWith( spies.devUtils.logInfo.firstCall,
						'\n📍 Building DLLs in ckeditor5...\n'
					);
					sinon.assert.calledWith( spies.devUtils.logInfo.secondCall,
						'\n📍 Building DLLs in ckeditor5-internal...\n'
					);
				} );
		} );

		it( 'should reject a promise if building DLLs has failed', () => {
			spies.isInteractive.returns( true );
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync.returns( JSON.stringify( {
				name: 'ckeditor5-example-package',
				scripts: {
					'dll:build': 'node ./scripts/build-dll'
				}
			} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );
			spies.childProcess.spawnExitCode = 1;

			return runManualTests( defaultOptions )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error.message ).to.equal( 'Building DLLs in ckeditor5 finished with an error.' );

						sinon.assert.calledOnce( spies.childProcess.spawn );
						sinon.assert.calledWith( spies.childProcess.spawn.firstCall,
							'yarnpkg',
							[ 'run', 'dll:build' ],
							{
								encoding: 'utf8',
								shell: true,
								cwd: '/absolute/path/to/workspace/ckeditor5',
								stdio: 'inherit'
							}
						);
					}
				);
		} );

		it( 'should build the DLLs in each repository for Windows environment', () => {
			sandbox.stub( process, 'platform' ).value( 'win32' );

			spies.isInteractive.returns( true );
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync.returns( JSON.stringify( {
				name: 'ckeditor5-example-package',
				scripts: {
					'dll:build': 'node ./scripts/build-dll'
				}
			} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.calledOnce( spies.scriptCompiler );
					sinon.assert.calledWith( spies.scriptCompiler.firstCall, {
						buildDir: 'workspace/build/.manual-tests',
						sourceFiles: [
							'workspace\\packages\\ckeditor5-foo\\tests\\manual\\feature-a.js',
							'workspace\\packages\\ckeditor5-bar\\tests\\manual\\feature-b.js',
							'workspace\\packages\\ckeditor-foo\\tests\\manual\\feature-c.js',
							'workspace\\packages\\ckeditor-bar\\tests\\manual\\feature-d.js',
							'workspace\\packages\\ckeditor5-foo\\tests\\manual\\dll\\feature-i-dll.js',
							'workspace\\packages\\ckeditor5-bar\\tests\\manual\\dll\\feature-j-dll.js'
						],
						themePath: null,
						language: undefined,
						onTestCompilationStatus: sinon.match.func,
						additionalLanguages: undefined,
						debug: undefined,
						disableWatch: false,
						identityFile: undefined
					} );

					sinon.assert.calledOnce( spies.htmlFileCompiler );
					sinon.assert.calledWith( spies.htmlFileCompiler.firstCall, {
						buildDir: 'workspace/build/.manual-tests',
						sourceFiles: [
							'workspace\\packages\\ckeditor5-foo\\tests\\manual\\feature-a.js',
							'workspace\\packages\\ckeditor5-bar\\tests\\manual\\feature-b.js',
							'workspace\\packages\\ckeditor-foo\\tests\\manual\\feature-c.js',
							'workspace\\packages\\ckeditor-bar\\tests\\manual\\feature-d.js',
							'workspace\\packages\\ckeditor5-foo\\tests\\manual\\dll\\feature-i-dll.js',
							'workspace\\packages\\ckeditor5-bar\\tests\\manual\\dll\\feature-j-dll.js'
						],
						language: undefined,
						onTestCompilationStatus: sinon.match.func,
						additionalLanguages: undefined,
						disableWatch: false,
						silent: false
					} );

					sinon.assert.calledThrice( spies.childProcess.spawn );
					sinon.assert.calledWith( spies.childProcess.spawn.firstCall,
						'yarnpkg',
						[ 'run', 'dll:build' ],
						{
							encoding: 'utf8',
							shell: true,
							cwd: '/absolute/path/to/workspace/ckeditor5',
							stdio: 'inherit'
						}
					);
					sinon.assert.calledWith( spies.childProcess.spawn.secondCall,
						'yarnpkg',
						[ 'run', 'dll:build' ],
						{
							encoding: 'utf8',
							shell: true,
							cwd: '/absolute/path/to/workspace/ckeditor5/external/ckeditor5-internal',
							stdio: 'inherit'
						}
					);
					sinon.assert.calledWith( spies.childProcess.spawn.thirdCall,
						'yarnpkg',
						[ 'run', 'dll:build' ],
						{
							encoding: 'utf8',
							shell: true,
							cwd: '/absolute/path/to/workspace/ckeditor5/external/collaboration-features',
							stdio: 'inherit'
						}
					);
				} );
		} );

		it( 'should set disableWatch to true if files flag is not provided', () => {
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync.returns( JSON.stringify( {
				name: 'ckeditor5-example-package',
				scripts: {
					'dll:build': 'node ./scripts/build-dll'
				}
			} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			return runManualTests( defaultOptions )
				.then( () => {
					sinon.assert.calledWith( spies.scriptCompiler.firstCall, sinon.match.has( "disableWatch", true ) );
				} );
		} );

		it( 'should set disableWatch to false if files flag is provided', () => {
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync.returns( JSON.stringify( {
				name: 'ckeditor5-example-package',
				scripts: {
					'dll:build': 'node ./scripts/build-dll'
				}
			} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			const options = {
				files: [
					'ckeditor5-classic',
					'ckeditor-classic/manual/classic.js'
				]
			};

			return runManualTests( { ...defaultOptions, ...options } )
				.then( () => {
					sinon.assert.calledWith( spies.scriptCompiler.firstCall, sinon.match.has( "disableWatch", false ) );
				} );
		} );

		it( 'should read disableWatch flag value even if files flag is provided', () => {
			spies.inquirer.prompt.resolves( { confirm: true } );
			spies.fs.readFileSync.returns( JSON.stringify( {
				name: 'ckeditor5-example-package',
				scripts: {
					'dll:build': 'node ./scripts/build-dll'
				}
			} ) );
			spies.transformFileOptionToTestGlob.returns( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );

			const options = {
				files: [
					'ckeditor5-classic',
					'ckeditor-classic/manual/classic.js'
				],
				disableWatch: true
			};

			return runManualTests( { ...defaultOptions, ...options } )
				.then( () => {
					sinon.assert.calledWith( spies.scriptCompiler.firstCall, sinon.match.has( "disableWatch", true ) );
				} );
		} );
	} );
} );
