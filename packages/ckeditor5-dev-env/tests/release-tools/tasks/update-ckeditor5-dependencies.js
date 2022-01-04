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
			process: {
				exit: sinon.stub( process, 'exit' ),
				stdin: {
					setRawMode: sinon.stub( process.stdin, 'setRawMode' ),
					on: sinon.stub( process.stdin, 'on' )
				}
			}
		};

		mockery.registerMock( 'readline', stubs.readline );
	} );

	afterEach( () => {
		mockery.disable();
		mockFs.restore();
		sinon.restore();
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
		updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
		updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
		updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
		updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
		updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
			updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
			updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
			updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
			updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
			updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
			updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
			updateCKEditor5Dependencies( { version: '2.0.0', packages: [ { path: process.cwd() + '/packages', commit: false } ] } );
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
			updateCKEditor5Dependencies( {
				version: '2.0.0',
				packages: [ { path: process.cwd() + '/packages', commit: false } ],
				dryRun: true
			} );
			consoleStub.restore();

			callback = stubs.process.stdin.on.firstCall.args[ 1 ];
		} );

		it( 'is a function', () => {
			expect( callback ).to.be.a( 'function' );
		} );

		it( 'exits after pressing Q', () => {
			const consoleStub = sinon.stub( console, 'log' );
			callback( null, { name: 'q' } );
			consoleStub.restore();

			expect( stubs.process.exit.called ).to.equal( true );
			expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '\x1B[33mManual exit.\x1B[39m' );
		} );
	} );
} );
