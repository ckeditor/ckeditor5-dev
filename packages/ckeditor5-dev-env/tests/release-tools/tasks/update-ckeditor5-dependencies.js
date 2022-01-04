/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const fs = require( 'fs' );
const mockery = require( 'mockery' );
const mockFs = require( 'mock-fs' );
const sinon = require( 'sinon' );
const stripAnsi = require( 'strip-ansi' );

describe( 'updateCKEditor5Dependencies()', () => {
	let stubs, updateCKEditor5Dependencies;

	beforeEach( () => {
		updateCKEditor5Dependencies = require( '../../../lib/release-tools/tasks/update-ckeditor5-dependencies' );

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			readline: {
				emitKeypressEvents: sinon.stub()
			},
			childProcess: {
				execSync: sinon.stub()
			},
			process: {
				stdin: {
					setRawMode: sinon.stub( process.stdin, 'setRawMode' ),
					on: sinon.stub( process.stdin, 'on' )
				}
			}
		};

		mockery.registerMock( 'readline', stubs.readline );
		mockery.registerMock( 'child_process', stubs.childProcess );
	} );

	afterEach( () => {
		mockery.disable();
		mockFs.restore();
		sinon.restore();
	} );

	it( 'works properly when it finds no files to update', () => {
		mockFs( {
			'packages': {
				'ckeditor5-foo': {}
			}
		} );

		const consoleStub = sinon.stub( console, 'log' );

		updateCKEditor5Dependencies( {
			version: '2.0.0',
			packages: [ { path: process.cwd() + '/packages', commit: false } ]
		} );

		consoleStub.restore();

		expect( consoleStub.getCall( 2 ).args[ 0 ] ).to.equal( 'No files were found.\n' );
	} );

	it( 'does not modify file without dependencies', () => {
		const packageJson = JSON.stringify( {
			'name': 'foo'
		}, null, 2 ) + '\n';

		mockFs( {
			'packages': {
				'ckeditor5-foo': {
					'package.json': packageJson
				}
			}
		} );

		const consoleStub = sinon.stub( console, 'log' );

		updateCKEditor5Dependencies( {
			version: '2.0.0',
			packages: [ { path: process.cwd() + '/packages', commit: false } ]
		} );

		consoleStub.restore();

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		expect( updatedPackageJson ).to.deep.equal( packageJson );
	} );

	it( 'does not modify file with up to date dependencies', () => {
		const packageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^2.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^2.0.0'
			}
		}, null, 2 ) + '\n';

		mockFs( {
			'packages': {
				'ckeditor5-foo': {
					'package.json': packageJson
				}
			}
		} );

		const consoleStub = sinon.stub( console, 'log' );

		updateCKEditor5Dependencies( {
			version: '2.0.0',
			packages: [ { path: process.cwd() + '/packages', commit: false } ]
		} );

		consoleStub.restore();

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		expect( updatedPackageJson ).to.deep.equal( packageJson );
	} );

	it( 'modifies file with outdated dependencies', () => {
		const packageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^1.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^1.0.0'
			}
		}, null, 2 ) + '\n';

		mockFs( {
			'packages': {
				'ckeditor5-foo': {
					'package.json': packageJson
				}
			}
		} );

		const consoleStub = sinon.stub( console, 'log' );

		updateCKEditor5Dependencies( {
			version: '2.0.0',
			packages: [ { path: process.cwd() + '/packages', commit: false } ]
		} );

		consoleStub.restore();

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^2.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^2.0.0'
			}
		}, null, 2 ) + '\n';

		expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
	} );

	it( 'modifies file with multiple outdated dependencies', () => {
		const packageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^1.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-basic-styles': '^1.0.0',
				'@ckeditor/ckeditor5-block-quote': '^1.0.0',
				'@ckeditor/ckeditor5-code-block': '^1.0.0',
				'@ckeditor/ckeditor5-core': '^1.0.0'
			}
		}, null, 2 ) + '\n';

		mockFs( {
			'packages': {
				'ckeditor5-foo': {
					'package.json': packageJson
				}
			}
		} );

		const consoleStub = sinon.stub( console, 'log' );

		updateCKEditor5Dependencies( {
			version: '2.0.0',
			packages: [ { path: process.cwd() + '/packages', commit: false } ]
		} );

		consoleStub.restore();

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^2.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-basic-styles': '^2.0.0',
				'@ckeditor/ckeditor5-block-quote': '^2.0.0',
				'@ckeditor/ckeditor5-code-block': '^2.0.0',
				'@ckeditor/ckeditor5-core': '^2.0.0'
			}
		}, null, 2 ) + '\n';

		expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
	} );

	it( 'modifies multiple files with outdated dependencies', () => {
		const packageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^1.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^1.0.0'
			}
		}, null, 2 ) + '\n';

		mockFs( {
			'packages': {
				'ckeditor5-foo': {
					'package.json': packageJson
				},
				'ckeditor5-bar': {
					'package.json': packageJson
				}
			}
		} );
		const consoleStub = sinon.stub( console, 'log' );

		updateCKEditor5Dependencies( {
			version: '2.0.0',
			packages: [ { path: process.cwd() + '/packages', commit: false } ]
		} );

		consoleStub.restore();

		const updatedPackageJsonFoo = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );
		const updatedPackageJsonBar = fs.readFileSync( process.cwd() + '/packages/ckeditor5-bar/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^2.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^2.0.0'
			}
		}, null, 2 ) + '\n';

		expect( updatedPackageJsonFoo ).to.deep.equal( expectedPackageJson );
		expect( updatedPackageJsonBar ).to.deep.equal( expectedPackageJson );
	} );

	/*
	it( 'commits modified directory if it has the `commit` flag', () => {
		const packageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^1.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^1.0.0'
			}
		}, null, 2 ) + '\n';

		mockFs( {
			'packages': {
				'ckeditor5-foo': {
					'package.json': packageJson
				}
			}
		} );

		const consoleStub = sinon.stub( console, 'log' );

		updateCKEditor5Dependencies( {
			version: '2.0.0',
			packages: [ { path: process.cwd() + '/packages', commit: true } ]
		} );

		consoleStub.restore();

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'name': 'foo',
			'dependencies': {
				'ckeditor5': '^2.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^2.0.0'
			}
		}, null, 2 ) + '\n';

		const path = process.cwd() + '/packages/ckeditor5-foo';

		expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		expect( stubs.childProcess.execSync.firstCall.args ).to.deep.equal( [
			`git add ${ path }`,
			{ stdio: 'inherit', cwd: path }
		] );
		expect( stubs.childProcess.execSync.secondCall.args ).to.deep.equal( [
			'git commit -m "Internal: Updated CKEditor 5 packages to the latest version. [skip ci]"',
			{ stdio: 'inherit', cwd: path }
		] );
	} );
	*/

	describe( 'does not update exceptions:', () => {
		it( '@ckeditor/ckeditor5-dev', () => {
			const packageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^1.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^1.0.0',
					'@ckeditor/ckeditor5-dev': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			mockFs( {
				'packages': {
					'ckeditor5-foo': {
						'package.json': packageJson
					}
				}
			} );

			const consoleStub = sinon.stub( console, 'log' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ]
			} );

			consoleStub.restore();

			const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

			const expectedPackageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^2.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^2.0.0',
					'@ckeditor/ckeditor5-dev': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		} );

		it( '@ckeditor/ckeditor5-dev-*', () => {
			const packageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^1.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^1.0.0',
					'@ckeditor/ckeditor5-dev-docs': '^1.0.0',
					'@ckeditor/ckeditor5-dev-env': '^1.0.0',
					'@ckeditor/ckeditor5-dev-tests': '^1.0.0',
					'@ckeditor/ckeditor5-dev-utils': '^1.0.0',
					'@ckeditor/ckeditor5-dev-webpack-plugin': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			mockFs( {
				'packages': {
					'ckeditor5-foo': {
						'package.json': packageJson
					}
				}
			} );

			const consoleStub = sinon.stub( console, 'log' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ]
			} );

			consoleStub.restore();

			const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

			const expectedPackageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^2.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^2.0.0',
					'@ckeditor/ckeditor5-dev-docs': '^1.0.0',
					'@ckeditor/ckeditor5-dev-env': '^1.0.0',
					'@ckeditor/ckeditor5-dev-tests': '^1.0.0',
					'@ckeditor/ckeditor5-dev-utils': '^1.0.0',
					'@ckeditor/ckeditor5-dev-webpack-plugin': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		} );

		it( '@ckeditor/ckeditor5-angular', () => {
			const packageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^1.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^1.0.0',
					'@ckeditor/ckeditor5-angular': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			mockFs( {
				'packages': {
					'ckeditor5-foo': {
						'package.json': packageJson
					}
				}
			} );

			const consoleStub = sinon.stub( console, 'log' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ]
			} );

			consoleStub.restore();

			const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

			const expectedPackageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^2.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^2.0.0',
					'@ckeditor/ckeditor5-angular': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		} );

		it( '@ckeditor/ckeditor5-react', () => {
			const packageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^1.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^1.0.0',
					'@ckeditor/ckeditor5-react': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			mockFs( {
				'packages': {
					'ckeditor5-foo': {
						'package.json': packageJson
					}
				}
			} );

			const consoleStub = sinon.stub( console, 'log' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ]
			} );

			consoleStub.restore();

			const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

			const expectedPackageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^2.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^2.0.0',
					'@ckeditor/ckeditor5-react': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		} );

		it( '@ckeditor/ckeditor5-vue', () => {
			const packageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^1.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^1.0.0',
					'@ckeditor/ckeditor5-vue': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			mockFs( {
				'packages': {
					'ckeditor5-foo': {
						'package.json': packageJson
					}
				}
			} );

			const consoleStub = sinon.stub( console, 'log' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ]
			} );

			consoleStub.restore();

			const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

			const expectedPackageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^2.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^2.0.0',
					'@ckeditor/ckeditor5-vue': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		} );

		it( '@ckeditor/ckeditor5-inspector', () => {
			const packageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^1.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^1.0.0',
					'@ckeditor/ckeditor5-inspector': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			mockFs( {
				'packages': {
					'ckeditor5-foo': {
						'package.json': packageJson
					}
				}
			} );

			const consoleStub = sinon.stub( console, 'log' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ]
			} );

			consoleStub.restore();

			const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

			const expectedPackageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^2.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^2.0.0',
					'@ckeditor/ckeditor5-inspector': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		} );

		it( 'dependencies unrelated to ckeditor5', () => {
			const packageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^1.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^1.0.0',
					'fooBarLibrary': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			mockFs( {
				'packages': {
					'ckeditor5-foo': {
						'package.json': packageJson
					}
				}
			} );
			const consoleStub = sinon.stub( console, 'log' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ]
			} );

			consoleStub.restore();

			const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

			const expectedPackageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^2.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^2.0.0',
					'fooBarLibrary': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		} );
	} );

	describe( 'options.dryRun', () => {
		it( 'displays file loading controls', () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ],
				dryRun: true
			} );

			consoleStub.restore();
			processExitStub.restore();

			expect( stripAnsi( consoleStub.getCall( 3 ).args[ 0 ] ) ).to.equal( '⚠️ DRY RUN mode ⚠️' );
			expect( stripAnsi( consoleStub.getCall( 4 ).args[ 0 ] ) ).to.equal( 'Enter / Space - Display next file diff' );
			expect( stripAnsi( consoleStub.getCall( 5 ).args[ 0 ] ) ).to.equal( '            A - Display diff from all files' );
			expect( stripAnsi( consoleStub.getCall( 6 ).args[ 0 ] ) ).to.equal( '      Esc / Q - Exit' );
		} );

		it( 'informs about no files being changed', () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ],
				dryRun: true
			} );

			consoleStub.restore();
			processExitStub.restore();

			expect( stripAnsi( consoleStub.getCall( 7 ).args[ 0 ] ) ).to.equal( 'The script has not changed any files.' );
		} );

		it( 'does not update any files', () => {
			const packageJson = JSON.stringify( {
				'name': 'foo',
				'dependencies': {
					'ckeditor5': '^1.0.0'
				},
				'devDependencies': {
					'@ckeditor/ckeditor5-core': '^1.0.0'
				}
			}, null, 2 ) + '\n';

			mockFs( {
				'packages': {
					'ckeditor5-foo': {
						'package.json': packageJson
					}
				}
			} );

			const consoleStub = sinon.stub( console, 'log' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ],
				dryRun: true
			} );

			consoleStub.restore();

			const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

			expect( updatedPackageJson ).to.deep.equal( packageJson );
		} );
	} );

	describe( 'process.stdin.on Callback', () => {
		let callback;

		beforeEach( () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ],
				dryRun: true
			} );

			consoleStub.restore();
			processExitStub.restore();

			callback = stubs.process.stdin.on.firstCall.args[ 1 ];
		} );

		it( 'is a function', () => {
			expect( callback ).to.be.a( 'function' );
		} );

		it( 'prints next file after pressing Enter', () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			try {
				callback( null, { name: 'return' } );
			} catch ( e ) {
				expect( e.message ).to.equal( 'Cannot read property \'content\' of undefined' );
			}

			consoleStub.restore();
			processExitStub.restore();

			expect( stripAnsi( consoleStub.firstCall.args[ 0 ] ) ).to.equal( 'Displaying next file.' );
			// expect( processExitStub.called ).to.equal( true );
		} );

		it( 'prints next file after pressing Space', () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			try {
				callback( null, { name: 'space' } );
			} catch ( e ) {
				expect( e.message ).to.equal( 'Cannot read property \'content\' of undefined' );
			}

			consoleStub.restore();
			processExitStub.restore();

			expect( stripAnsi( consoleStub.firstCall.args[ 0 ] ) ).to.equal( 'Displaying next file.' );
			// expect( processExitStub.called ).to.equal( true );
		} );

		it( 'prints all files after pressing A', () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			try {
				callback( null, { name: 'a' } );
			} catch ( e ) {
				expect( e.message ).to.equal( 'Cannot read property \'content\' of undefined' );
			}

			consoleStub.restore();
			processExitStub.restore();

			expect( stripAnsi( consoleStub.firstCall.args[ 0 ] ) ).to.equal( 'Displaying all files.' );
			// expect( processExitStub.called ).to.equal( true );
		} );

		it( 'exits after pressing ESC', () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'escape' } );

			consoleStub.restore();
			processExitStub.restore();

			expect( stripAnsi( consoleStub.firstCall.args[ 0 ] ) ).to.equal( 'Manual exit.' );
			expect( processExitStub.called ).to.equal( true );
		} );

		it( 'exits after pressing Q', () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'q' } );

			consoleStub.restore();
			processExitStub.restore();

			expect( stripAnsi( consoleStub.firstCall.args[ 0 ] ) ).to.equal( 'Manual exit.' );
			expect( processExitStub.called ).to.equal( true );
		} );

		it( 'does nothing after pressing other keys', () => {
			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'x' } );
			callback( null, { name: 'u' } );
			callback( null, { name: 'y' } );
			callback( null, { name: '1' } );
			callback( null, { name: '5' } );
			callback( null, { name: '9' } );
			callback( null, { name: 'backspace' } );

			consoleStub.restore();
			processExitStub.restore();

			expect( consoleStub.called ).to.equal( false );
			expect( processExitStub.called ).to.equal( false );
		} );
	} );
} );
