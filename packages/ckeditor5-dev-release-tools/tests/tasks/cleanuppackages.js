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
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'cwd', '/work/another/project' );
			} );

			it( 'should use `process.cwd()` to search for packages if `cwd` option is not provided', () => {
				sandbox.stub( process, 'cwd' ).returns( '/work/project' );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'cwd', '/work/project' );
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

			it( 'should search for `package.json` in `packagesDirectory`', () => {
				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 0 ] ).to.equal( 'release/*/package.json' );
			} );

			it( 'should remove trailing path separators from the `packagesDirectory`', () => {
				cleanUpPackages( {
					packagesDirectory: 'path/to/packages/'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 0 ] ).to.equal( 'path/to/packages/*/package.json' );
			} );

			it( 'should convert backslashes to slashes from the `packagesDirectory`', () => {
				cleanUpPackages( {
					packagesDirectory: 'path\\to\\packages\\'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 0 ] ).to.equal( 'path/to/packages/*/package.json' );
			} );
		} );

		describe( 'cleaning package directory', () => {
			it( 'should not remove anything if `files` field is not set', () => {
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

				expect( stubs.fs.removeSync.callCount ).to.equal( 0 );
			} );

			it( 'should not remove mandatory files', () => {
				mockFs( {
					'release': {
						'ckeditor5-foo': {
							'package.json': JSON.stringify( {
								name: 'ckeditor5-foo'
							} ),
							'README.md': '## The header',
							'LICENSE.md': '## The header'
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.fs.removeSync.callCount ).to.equal( 0 );
			} );

			it( 'should not remove matched files - pattern without globs', () => {
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
							}
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.fs.removeSync.callCount ).to.equal( 0 );
			} );

			it( 'should not remove matched files - pattern with globs', () => {
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
							}
						}
					}
				} );

				cleanUpPackages( {
					packagesDirectory: 'release'
				} );

				expect( stubs.fs.removeSync.callCount ).to.equal( 0 );
			} );

			it( 'should remove not matched files and empty directories - pattern without globs', () => {
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

				expect( stubs.fs.removeSync.callCount ).to.equal( 11 );

				const actualRemovedPaths = getAllPaths( stubs.fs.removeSync, 0 );
				const expectedRemovedPaths = [
					getPathTo( 'release/ckeditor5-foo/docs/features/foo.md' ),
					getPathTo( 'release/ckeditor5-foo/docs/features' ),
					getPathTo( 'release/ckeditor5-foo/docs/assets/img/asset.png' ),
					getPathTo( 'release/ckeditor5-foo/docs/assets/img' ),
					getPathTo( 'release/ckeditor5-foo/docs/assets' ),
					getPathTo( 'release/ckeditor5-foo/docs/api/foo.md' ),
					getPathTo( 'release/ckeditor5-foo/docs/api' ),
					getPathTo( 'release/ckeditor5-foo/docs' ),
					getPathTo( 'release/ckeditor5-foo/tests/_utils' ),
					getPathTo( 'release/ckeditor5-foo/tests/index.js' ),
					getPathTo( 'release/ckeditor5-foo/tests' )
				];

				for ( const expectedRemovedPath of expectedRemovedPaths ) {
					expect( actualRemovedPaths ).to.include( expectedRemovedPath );
				}
			} );

			it( 'should remove not matched files and empty directories - pattern with globs', () => {
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

				expect( stubs.fs.removeSync.callCount ).to.equal( 21 );

				const actualRemovedPaths = getAllPaths( stubs.fs.removeSync, 0 );
				const expectedRemovedPaths = [
					getPathTo( 'release/ckeditor5-foo/docs' ),
					getPathTo( 'release/ckeditor5-foo/docs/api' ),
					getPathTo( 'release/ckeditor5-foo/docs/api/foo.md' ),
					getPathTo( 'release/ckeditor5-foo/docs/assets' ),
					getPathTo( 'release/ckeditor5-foo/docs/assets/img' ),
					getPathTo( 'release/ckeditor5-foo/docs/assets/img/asset.png' ),
					getPathTo( 'release/ckeditor5-foo/docs/features' ),
					getPathTo( 'release/ckeditor5-foo/docs/features/foo.md' ),
					getPathTo( 'release/ckeditor5-foo/src/index.ts' ),
					getPathTo( 'release/ckeditor5-foo/src/index.js.map' ),
					getPathTo( 'release/ckeditor5-foo/src/ui/view-foo.ts' ),
					getPathTo( 'release/ckeditor5-foo/src/ui/view-foo.js.map' ),
					getPathTo( 'release/ckeditor5-foo/src/ui/view-bar.ts' ),
					getPathTo( 'release/ckeditor5-foo/src/ui/view-bar.js.map' ),
					getPathTo( 'release/ckeditor5-foo/src/commands/command-foo.ts' ),
					getPathTo( 'release/ckeditor5-foo/src/commands/command-foo.js.map' ),
					getPathTo( 'release/ckeditor5-foo/src/commands/command-bar.ts' ),
					getPathTo( 'release/ckeditor5-foo/src/commands/command-bar.js.map' ),
					getPathTo( 'release/ckeditor5-foo/tests' ),
					getPathTo( 'release/ckeditor5-foo/tests/index.js' ),
					getPathTo( 'release/ckeditor5-foo/tests/_utils' )
				];

				for ( const expectedRemovedPath of expectedRemovedPaths ) {
					expect( actualRemovedPaths ).to.include( expectedRemovedPath );
				}
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
		} );
	} );
} );

function getPathTo( path ) {
	return upath.join( process.cwd(), path );
}

function getAllPaths( spy, argument ) {
	const callIndexes = [ ...Array( spy.callCount ).keys() ];

	return callIndexes
		.map( call => spy.getCall( call ).args[ argument ] )
		.map( path => upath.normalize( path ) );
}
