/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const fs = require( 'fs' );
const path = require( 'path' );
const mockery = require( 'mockery' );
const mockFs = require( 'mock-fs' );
const sinon = require( 'sinon' );
const stripAnsi = require( 'strip-ansi' );

describe( 'updateCKEditor5Dependencies()', () => {
	let stubs, updateCKEditor5Dependencies;

	beforeEach( () => {
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

		updateCKEditor5Dependencies = require( '../../../lib/release-tools/tasks/update-ckeditor5-dependencies' );
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

		const dirPath = path.join( process.cwd(), 'packages' )
			.split( /[/\\]/ )
			.join( path.posix.sep );

		expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
		expect( stubs.childProcess.execSync.firstCall.args ).to.deep.equal( [
			`git add ${ dirPath }/*/package.json`,
			{ stdio: 'inherit', cwd: dirPath }
		] );
		expect( stubs.childProcess.execSync.secondCall.args ).to.deep.equal( [
			'git commit -m "Internal: Updated CKEditor 5 packages to the latest version. [skip ci]"',
			{ stdio: 'inherit', cwd: dirPath }
		] );
	} );

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

		it( 'prints single file after pressing Enter', () => {
			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: '"ckeditor5": "^1.0.0"\n', removed: true },
					{ value: '"ckeditor5": "^2.0.0"\n', added: true },
					{ value: '"ckeditor5-core": "^2.0.0"\n' }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'return' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying next file.',
				'File: \'foo.js\'',
				'"ckeditor5": "^1.0.0"',
				'"^2.0.0"',
				'"ckeditor5-core": "^2.0.0"',
				'',
				'No more files.'
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( true );
		} );

		it( 'prints single file after pressing Space', () => {
			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: '"ckeditor5": "^1.0.0"\n', removed: true },
					{ value: '"ckeditor5": "^2.0.0"\n', added: true },
					{ value: '"ckeditor5-core": "^2.0.0"\n' }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'space' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying next file.',
				'File: \'foo.js\'',
				'"ckeditor5": "^1.0.0"',
				'"^2.0.0"',
				'"ckeditor5-core": "^2.0.0"',
				'',
				'No more files.'
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( true );
		} );

		it( 'after printing single file, shows controls if it wasn\'t the last file', () => {
			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: '"ckeditor5": "^1.0.0"\n', removed: true },
					{ value: '"ckeditor5": "^2.0.0"\n', added: true },
					{ value: '"ckeditor5-core": "^2.0.0"\n' }
				]
			}, {
				file: 'bar.js',
				content: [
					{ value: '"ckeditor5": "^1.0.0"\n', removed: true },
					{ value: '"ckeditor5": "^2.0.0"\n', added: true },
					{ value: '"ckeditor5-core": "^2.0.0"\n' }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'return' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying next file.',
				'File: \'foo.js\'',
				'"ckeditor5": "^1.0.0"',
				'"^2.0.0"',
				'"ckeditor5-core": "^2.0.0"',
				'',
				'Enter / Space - Next     A - All     Esc / Q - Exit'
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( false );
		} );

		it( 'prints all files after pressing A', () => {
			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: '"ckeditor5": "^1.0.0"\n', removed: true },
					{ value: '"ckeditor5": "^2.0.0"\n', added: true },
					{ value: '"ckeditor5-core": "^2.0.0"\n' }
				]
			}, {
				file: 'bar.js',
				content: [
					{ value: '"ckeditor5": "^1.0.0"\n', removed: true },
					{ value: '"ckeditor5": "^2.0.0"\n', added: true },
					{ value: '"ckeditor5-core": "^2.0.0"\n' }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'a' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying all files.',
				'File: \'foo.js\'',
				'"ckeditor5": "^1.0.0"',
				'"^2.0.0"',
				'"ckeditor5-core": "^2.0.0"',
				'',
				'File: \'bar.js\'',
				'"ckeditor5": "^1.0.0"',
				'"^2.0.0"',
				'"ckeditor5-core": "^2.0.0"',
				''
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( true );
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

		it( 'cuts out long streaks of unchanged lines', () => {
			const string = '{\n' +
			'  "keywords": [\n' +
			'    "ckeditor 1",\n' +
			'    "ckeditor 2",\n' +
			'    "ckeditor 3",\n' +
			'    "ckeditor 4",\n' +
			'    "ckeditor 5",\n' +
			'    "ckeditor 6",\n' +
			'    "ckeditor 7",\n' +
			'    "ckeditor 8",\n' +
			'    "ckeditor 9",\n' +
			'    "ckeditor 10",\n' +
			'    "ckeditor 11",\n' +
			'    "ckeditor 12"\n' +
			'  ],\n' +
			'}\n';

			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: string }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'a' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying all files.',
				'File: \'foo.js\'',
				'{',
				'  "keywords": [',
				'    "ckeditor 1",',
				'[...10 lines without changes...]',
				'    "ckeditor 12"',
				'  ],',
				'}',
				''
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( true );
		} );

		it( 'does not trim single additions', () => {
			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: '{\n  "keywords": [\n    "ckeditor",\n' },
					{ value: '    "ckeditor5",\n', added: true },
					{ value: '    "ckeditor 5"\n  ],\n}\n' }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'a' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying all files.',
				'File: \'foo.js\'',
				'{',
				'  "keywords": [',
				'    "ckeditor",',
				'    "ckeditor5",',
				'    "ckeditor 5"',
				'  ],',
				'}',
				''
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( true );
		} );

		it( 'merges only valid sequences (case 1)', () => {
			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: '"ckeditor5": "^1.0.0"\n', removed: true },
					{ value: '"ckeditor5-core": "^2.0.0"\n' }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'a' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying all files.',
				'File: \'foo.js\'',
				'"ckeditor5": "^1.0.0"',
				'"ckeditor5-core": "^2.0.0"',
				''
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( true );
		} );

		it( 'merges only valid sequences (case 2)', () => {
			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: '"propertyFoo": [', removed: true },
					{ value: '"propertyBar": [', added: true },
					{ value: '\n  "string"\n]\n' }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'a' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying all files.',
				'File: \'foo.js\'',
				'"propertyFoo": ["propertyBar": [',
				'  "string"',
				']',
				''
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( true );
		} );

		it( 'merges only valid sequences (case 3)', () => {
			callback.differences = [ {
				file: 'foo.js',
				content: [
					{ value: '"propertyFoo": "foo",', removed: true },
					{ value: '"propertyFoo": [\n  "string"\n]', added: true }
				]
			} ];

			const consoleStub = sinon.stub( console, 'log' );
			const processExitStub = sinon.stub( process, 'exit' );

			callback( null, { name: 'a' } );

			consoleStub.restore();
			processExitStub.restore();

			[
				'Displaying all files.',
				'File: \'foo.js\'',
				'"propertyFoo": "foo","propertyFoo": [',
				'  "string"',
				']'
			].forEach( ( string, index ) => {
				expect( stripAnsi( consoleStub.getCall( index ).args[ 0 ] ) ).to.equal( string );
			} );

			expect( processExitStub.called ).to.equal( true );
		} );
	} );
} );

