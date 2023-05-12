/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const fs = require( 'fs-extra' );
const upath = require( 'upath' );
const { globSync } = require( 'glob' );

const mockFs = require( 'mock-fs' );

describe( 'dev-release-tools/tasks', () => {
	describe( 'cleanUpPackages()', () => {
		let cleanUpPackages, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			// Calls to `fs` and `glob` are stubbed, but they are passed through to the real implementation, because we want to test the
			// real behavior of the script. The whole filesystem is mocked by the `mock-fs` util for testing purposes. A virtual project is
			// prepared in tests on this mocked filesystem.
			stubs = {
				fs: {
					readJsonSync: sandbox.stub().callsFake( ( ...args ) => fs.readJsonSync( ...args ) ),
					writeJsonSync: sandbox.stub().callsFake( ( ...args ) => fs.writeJsonSync( ...args ) ),
					removeSync: sandbox.stub().callsFake( ( ...args ) => fs.removeSync( ...args ) ),
					readdirSync: sandbox.stub().callsFake( ( ...args ) => fs.readdirSync( ...args ) )
				},
				glob: {
					globSync: sandbox.stub().callsFake( ( ...args ) => globSync( ...args ) )
				},
				devUtils: {
					logger: sandbox.stub().returns( {
						error: sandbox.stub(),
						warning: sandbox.stub(),
						info: sandbox.stub()
					} )
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );
			mockery.registerMock( 'glob', stubs.glob );
			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', stubs.devUtils );

			cleanUpPackages = require( '../../lib/tasks/cleanuppackages' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			mockFs.restore();
			sandbox.restore();
		} );

		describe( 'preparing options', () => {
			beforeEach( () => {
				mockFs( {} );
			} );

			it( 'should use provided `cwd` to search for packages', () => {
				cleanUpPackages( {
					packagesDirectory: 'release',
					cwd: '/work/another/project'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'cwd', '/work/another/project/release' );
			} );

			it( 'should use `process.cwd()` to search for packages if `cwd` option is not provided', () => {
				sandbox.stub( process, 'cwd' ).returns( '/work/project' );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'cwd', '/work/project/release' );
			} );

			it( 'should match only files', () => {
				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'nodir', true );
			} );

			it( 'should always receive absolute paths for matched files', () => {
				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'absolute', true );
			} );

			it( 'should search for `package.json` in `cwd`', () => {
				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 0 ] ).to.equal( '*/package.json' );
			} );
		} );

		describe( 'cleaning package directory', () => {
			it( 'should remove empty directories', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo'
							} ),
							'ckeditor5-metadata.json': '',
							'src': {}
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				const actualPaths = getAllPaths();

				expect( actualPaths ).to.have.members( [
					getPathTo( '.' ),
					getPathTo( 'release' ),
					getPathTo( 'release/ckeditor5-foo' ),
					getPathTo( 'release/ckeditor5-foo/package.json' ),
					getPathTo( 'release/ckeditor5-foo/ckeditor5-metadata.json' )
				] );
			} );

			it( 'should remove `node_modules`', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo'
							} ),
							'ckeditor5-metadata.json': '',
							'node_modules': {
								'.bin': {},
								'@ckeditor': {
									'ckeditor5-dev-release-tools': {
										'package.json': ''
									}
								}
							}
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				const actualPaths = getAllPaths();

				expect( actualPaths ).to.have.members( [
					getPathTo( '.' ),
					getPathTo( 'release' ),
					getPathTo( 'release/ckeditor5-foo' ),
					getPathTo( 'release/ckeditor5-foo/package.json' ),
					getPathTo( 'release/ckeditor5-foo/ckeditor5-metadata.json' )
				] );
			} );

			it( 'should not remove any file if `files` field is not set', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo'
							} ),
							'ckeditor5-metadata.json': ''
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				const actualPaths = getAllPaths();

				expect( actualPaths ).to.have.members( [
					getPathTo( '.' ),
					getPathTo( 'release' ),
					getPathTo( 'release/ckeditor5-foo' ),
					getPathTo( 'release/ckeditor5-foo/package.json' ),
					getPathTo( 'release/ckeditor5-foo/ckeditor5-metadata.json' )
				] );
			} );

			it( 'should not remove mandatory files', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo',
								main: 'src/index.js',
								types: 'src/index.d.ts',
								files: [
									'foo'
								]
							} ),
							'README.md': '',
							'LICENSE.md': '',
							'src': {
								'index.js': '',
								'index.d.ts': ''
							}
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				const actualPaths = getAllPaths();

				expect( actualPaths ).to.have.members( [
					getPathTo( '.' ),
					getPathTo( 'release' ),
					getPathTo( 'release/ckeditor5-foo' ),
					getPathTo( 'release/ckeditor5-foo/package.json' ),
					getPathTo( 'release/ckeditor5-foo/README.md' ),
					getPathTo( 'release/ckeditor5-foo/LICENSE.md' ),
					getPathTo( 'release/ckeditor5-foo/src' ),
					getPathTo( 'release/ckeditor5-foo/src/index.js' ),
					getPathTo( 'release/ckeditor5-foo/src/index.d.ts' )
				] );
			} );

			it( 'should remove not matched dot files and dot directories', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'.github': {
								'template.md': ''
							},
							'.eslintrc.js': '',
							'.IMPORTANT.md': '',
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo',
								files: [
									'.IMPORTANT.md',
									'src'
								]
							} ),
							'README.md': '',
							'LICENSE.md': '',
							'src': {
								'index.js': '',
								'index.d.ts': ''
							}
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				const actualPaths = getAllPaths();

				expect( actualPaths ).to.have.members( [
					getPathTo( '.' ),
					getPathTo( 'release' ),
					getPathTo( 'release/ckeditor5-foo' ),
					getPathTo( 'release/ckeditor5-foo/.IMPORTANT.md' ),
					getPathTo( 'release/ckeditor5-foo/package.json' ),
					getPathTo( 'release/ckeditor5-foo/README.md' ),
					getPathTo( 'release/ckeditor5-foo/LICENSE.md' ),
					getPathTo( 'release/ckeditor5-foo/src' ),
					getPathTo( 'release/ckeditor5-foo/src/index.js' ),
					getPathTo( 'release/ckeditor5-foo/src/index.d.ts' )
				] );
			} );

			it( 'should remove not matched files, empty directories and `node_modules` - pattern without globs', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo',
								files: [
									'ckeditor5-metadata.json',
									'src'
								]
							} ),
							'README.md': '',
							'LICENSE.md': '',
							'ckeditor5-metadata.json': '',
							'docs': {
								'assets': {
									'img': {
										'asset.png': ''
									}
								},
								'api': {
									'foo.md': ''
								},
								'features': {
									'foo.md': ''
								}
							},
							'node_modules': {
								'.bin': {},
								'@ckeditor': {
									'ckeditor5-dev-release-tools': {
										'package.json': ''
									}
								}
							},
							'src': {
								'commands': {
									'command-foo.js': '',
									'command-bar.js': ''
								},
								'ui': {
									'view-foo.js': '',
									'view-bar.js': ''
								},
								'index.js': ''
							},
							'tests': {
								'_utils': {},
								'index.js': ''
							}
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				const actualPaths = getAllPaths();

				expect( actualPaths ).to.have.members( [
					getPathTo( '.' ),
					getPathTo( 'release' ),
					getPathTo( 'release/ckeditor5-foo' ),
					getPathTo( 'release/ckeditor5-foo/package.json' ),
					getPathTo( 'release/ckeditor5-foo/ckeditor5-metadata.json' ),
					getPathTo( 'release/ckeditor5-foo/README.md' ),
					getPathTo( 'release/ckeditor5-foo/LICENSE.md' ),
					getPathTo( 'release/ckeditor5-foo/src' ),
					getPathTo( 'release/ckeditor5-foo/src/ui' ),
					getPathTo( 'release/ckeditor5-foo/src/index.js' ),
					getPathTo( 'release/ckeditor5-foo/src/commands' ),
					getPathTo( 'release/ckeditor5-foo/src/ui/view-foo.js' ),
					getPathTo( 'release/ckeditor5-foo/src/ui/view-bar.js' ),
					getPathTo( 'release/ckeditor5-foo/src/commands/command-foo.js' ),
					getPathTo( 'release/ckeditor5-foo/src/commands/command-bar.js' )
				] );
			} );

			it( 'should remove not matched files, empty directories and `node_modules` - pattern with globs', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo',
								files: [
									'ckeditor5-metadata.json',
									'src/**/*.js'
								]
							} ),
							'README.md': '',
							'LICENSE.md': '',
							'ckeditor5-metadata.json': '',
							'docs': {
								'assets': {
									'img': {
										'asset.png': ''
									}
								},
								'api': {
									'foo.md': ''
								},
								'features': {
									'foo.md': ''
								}
							},
							'node_modules': {
								'.bin': {},
								'@ckeditor': {
									'ckeditor5-dev-release-tools': {
										'package.json': ''
									}
								}
							},
							'src': {
								'commands': {
									'command-foo.js': '',
									'command-foo.js.map': '',
									'command-foo.ts': '',
									'command-bar.js': '',
									'command-bar.js.map': '',
									'command-bar.ts': ''
								},
								'ui': {
									'view-foo.js': '',
									'view-foo.js.map': '',
									'view-foo.ts': '',
									'view-bar.js': '',
									'view-bar.js.map': '',
									'view-bar.ts': ''
								},
								'index.js': '',
								'index.js.map': '',
								'index.ts': ''
							},
							'tests': {
								'_utils': {},
								'index.js': ''
							}
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				const actualPaths = getAllPaths();

				expect( actualPaths ).to.have.members( [
					getPathTo( '.' ),
					getPathTo( 'release' ),
					getPathTo( 'release/ckeditor5-foo' ),
					getPathTo( 'release/ckeditor5-foo/package.json' ),
					getPathTo( 'release/ckeditor5-foo/ckeditor5-metadata.json' ),
					getPathTo( 'release/ckeditor5-foo/README.md' ),
					getPathTo( 'release/ckeditor5-foo/LICENSE.md' ),
					getPathTo( 'release/ckeditor5-foo/src' ),
					getPathTo( 'release/ckeditor5-foo/src/ui' ),
					getPathTo( 'release/ckeditor5-foo/src/index.js' ),
					getPathTo( 'release/ckeditor5-foo/src/commands' ),
					getPathTo( 'release/ckeditor5-foo/src/ui/view-foo.js' ),
					getPathTo( 'release/ckeditor5-foo/src/ui/view-bar.js' ),
					getPathTo( 'release/ckeditor5-foo/src/commands/command-foo.js' ),
					getPathTo( 'release/ckeditor5-foo/src/commands/command-bar.js' )
				] );
			} );
		} );

		describe( 'cleaning `package.json`', () => {
			it( 'should read and write `package.json` from each found package', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo'
							} )
						},
						'ckeditor5-bar': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-bar'
							} )
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				// Reading `package.json`.
				expect( stubs.fs.readJsonSync.callCount ).to.equal( 2 );

				let call = stubs.fs.readJsonSync.getCall( 0 );

				expect( call.returnValue ).to.have.property( 'name', 'ckeditor5-foo' );
				expect( upath.normalize( call.args[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );

				call = stubs.fs.readJsonSync.getCall( 1 );

				expect( call.returnValue ).to.have.property( 'name', 'ckeditor5-bar' );
				expect( upath.normalize( call.args[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-bar/package.json' ) );

				// Writing `package.json`.
				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 2 );

				call = stubs.fs.writeJsonSync.getCall( 0 );

				expect( upath.normalize( call.args[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );

				call = stubs.fs.writeJsonSync.getCall( 1 );

				expect( upath.normalize( call.args[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-bar/package.json' ) );
			} );

			it( 'should not remove any field from `package.json` if all of them are mandatory', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo',
								version: '1.0.0',
								description: 'Example package.',
								dependencies: {
									'ckeditor5': '^37.1.0'
								},
								main: 'src/index.ts'
							} )
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 1 );

				const call = stubs.fs.writeJsonSync.getCall( 0 );

				expect( upath.normalize( call.args[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
				expect( call.args[ 1 ] ).to.deep.equal( {
					name: 'ckeditor5-foo',
					version: '1.0.0',
					description: 'Example package.',
					dependencies: {
						'ckeditor5': '^37.1.0'
					},
					main: 'src/index.ts'
				} );
			} );

			it( 'should remove default unnecessary fields from `package.json`', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo',
								version: '1.0.0',
								description: 'Example package.',
								dependencies: {
									'ckeditor5': '^37.1.0'
								},
								devDependencies: {
									'typescript': '^4.8.4'
								},
								main: 'src/index.ts',
								depcheckIgnore: [
									'eslint-plugin-ckeditor5-rules'
								],
								scripts: {
									'build': 'tsc -p ./tsconfig.json',
									'dll:build': 'webpack'
								}
							} )
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 1 );

				const call = stubs.fs.writeJsonSync.getCall( 0 );

				expect( upath.normalize( call.args[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
				expect( call.args[ 1 ] ).to.deep.equal( {
					name: 'ckeditor5-foo',
					version: '1.0.0',
					description: 'Example package.',
					dependencies: {
						'ckeditor5': '^37.1.0'
					},
					main: 'src/index.ts'
				} );
			} );

			it( 'should remove provided unnecessary fields from `package.json`', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo',
								author: 'CKEditor 5 Devops Team',
								version: '1.0.0',
								description: 'Example package.',
								dependencies: {
									'ckeditor5': '^37.1.0'
								},
								devDependencies: {
									'typescript': '^4.8.4'
								},
								main: 'src/index.ts',
								depcheckIgnore: [
									'eslint-plugin-ckeditor5-rules'
								],
								scripts: {
									'build': 'tsc -p ./tsconfig.json',
									'dll:build': 'webpack'
								}
							} )
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release',
					packageJsonFieldsToRemove: [ 'author' ]
				} );

				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 1 );

				const call = stubs.fs.writeJsonSync.getCall( 0 );

				expect( upath.normalize( call.args[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
				expect( call.args[ 1 ] ).to.deep.equal( {
					name: 'ckeditor5-foo',
					version: '1.0.0',
					description: 'Example package.',
					dependencies: {
						'ckeditor5': '^37.1.0'
					},
					devDependencies: {
						'typescript': '^4.8.4'
					},
					main: 'src/index.ts',
					depcheckIgnore: [
						'eslint-plugin-ckeditor5-rules'
					],
					scripts: {
						'build': 'tsc -p ./tsconfig.json',
						'dll:build': 'webpack'
					}
				} );
			} );
		} );
	} );
} );

function getPathTo( path ) {
	return upath.join( process.cwd(), path );
}

function getAllPaths() {
	return globSync( '**', {
		absolute: true,
		dot: true
	} ).map( upath.normalize );
}
