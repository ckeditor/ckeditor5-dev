/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import upath from 'upath';
import { glob } from 'glob';
import mockFs from 'mock-fs';

describe( 'cleanUpPackages()', () => {
	let cleanUpPackages, stubs;

	beforeEach( async () => {
		// Calls to `fs` and `glob` are stubbed, but they are passed through to the real implementation, because we want to test the
		// real behavior of the script. The whole filesystem is mocked by the `mock-fs` util for testing purposes. A virtual project is
		// prepared in tests on this mocked filesystem.
		vi.doMock( 'glob', () => ( {
			glob: vi.fn().mockImplementation( glob )
		} ) );
		vi.doMock( 'fs-extra', () => ( {
			default: {
				readJson: vi.fn().mockImplementation( fs.readJson ),
				writeJson: vi.fn().mockImplementation( fs.writeJson ),
				remove: vi.fn().mockImplementation( fs.remove ),
				readdir: vi.fn().mockImplementation( fs.readdir )
			}
		} ) );

		stubs = {
			...await import( 'glob' ),
			...( await import( 'fs-extra' ) ).default
		};

		cleanUpPackages = ( await import( '../../lib/tasks/cleanuppackages.js' ) ).default;
	} );

	afterEach( () => {
		vi.resetModules();
		mockFs.restore();
	} );

	describe( 'preparing options', () => {
		beforeEach( () => {
			mockFs( {} );
		} );

		it( 'should use provided `cwd` to search for packages', async () => {
			await cleanUpPackages( {
				packagesDirectory: 'release',
				cwd: '/work/another/project'
			} );

			expect( stubs.glob ).toHaveBeenCalledExactlyOnceWith( expect.any( String ), expect.objectContaining( {
				cwd: '/work/another/project/release'
			} ) );
		} );

		it( 'should use `process.cwd()` to search for packages if `cwd` option is not provided', async () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/project' );

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.glob ).toHaveBeenCalledExactlyOnceWith( expect.any( String ), expect.objectContaining( {
				cwd: '/work/project/release'
			} ) );
		} );

		it( 'should match only files', async () => {
			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.glob ).toHaveBeenCalledExactlyOnceWith( expect.any( String ), expect.objectContaining( {
				nodir: true
			} ) );
		} );

		it( 'should always receive absolute paths for matched files', async () => {
			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.glob ).toHaveBeenCalledExactlyOnceWith( expect.any( String ), expect.objectContaining( {
				absolute: true
			} ) );
		} );

		it( 'should search for `package.json` in `cwd`', async () => {
			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.glob ).toHaveBeenCalledExactlyOnceWith( '*/package.json', expect.any( Object ) );
		} );
	} );

	describe( 'cleaning package directory', () => {
		it( 'should remove empty directories', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			const actualPaths = await getAllPaths();

			expect( actualPaths ).to.have.members( [
				getPathTo( '.' ),
				getPathTo( 'release' ),
				getPathTo( 'release/ckeditor5-foo' ),
				getPathTo( 'release/ckeditor5-foo/package.json' ),
				getPathTo( 'release/ckeditor5-foo/ckeditor5-metadata.json' )
			] );
		} );

		it( 'should remove `node_modules`', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			const actualPaths = await getAllPaths();

			expect( actualPaths ).to.have.members( [
				getPathTo( '.' ),
				getPathTo( 'release' ),
				getPathTo( 'release/ckeditor5-foo' ),
				getPathTo( 'release/ckeditor5-foo/package.json' ),
				getPathTo( 'release/ckeditor5-foo/ckeditor5-metadata.json' )
			] );
		} );

		it( 'should not remove any file if `files` field is not set', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			const actualPaths = await getAllPaths();

			expect( actualPaths ).to.have.members( [
				getPathTo( '.' ),
				getPathTo( 'release' ),
				getPathTo( 'release/ckeditor5-foo' ),
				getPathTo( 'release/ckeditor5-foo/package.json' ),
				getPathTo( 'release/ckeditor5-foo/ckeditor5-metadata.json' )
			] );
		} );

		it( 'should not remove mandatory files', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			const actualPaths = await getAllPaths();

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

		it( 'should remove not matched dot files and dot directories', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			const actualPaths = await getAllPaths();

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

		it( 'should remove not matched files, empty directories and `node_modules` - pattern without globs', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			const actualPaths = await getAllPaths();

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

		it( 'should remove not matched files, empty directories and `node_modules` - pattern with globs', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			const actualPaths = await getAllPaths();

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
		it( 'should read and write `package.json` from each found package', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			// Reading `package.json`.
			expect( stubs.readJson ).toHaveBeenCalledTimes( 2 );

			let input = stubs.readJson.mock.calls[ 0 ];
			let call = stubs.readJson.mock.results[ 0 ];

			expect( await call.value ).to.have.property( 'name', 'ckeditor5-foo' );
			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );

			input = stubs.readJson.mock.calls[ 1 ];
			call = stubs.readJson.mock.results[ 1 ];

			expect( await call.value ).to.have.property( 'name', 'ckeditor5-bar' );
			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-bar/package.json' ) );

			// Writing `package.json`.
			expect( stubs.writeJson ).toHaveBeenCalledTimes( 2 );

			input = stubs.writeJson.mock.calls[ 0 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );

			input = stubs.writeJson.mock.calls[ 1 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-bar/package.json' ) );
		} );

		it( 'should not remove any field from `package.json` if all of them are mandatory', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.writeJson ).toHaveBeenCalledTimes( 1 );

			const input = stubs.writeJson.mock.calls[ 0 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
			expect( input[ 1 ] ).to.deep.equal( {
				name: 'ckeditor5-foo',
				version: '1.0.0',
				description: 'Example package.',
				dependencies: {
					'ckeditor5': '^37.1.0'
				},
				main: 'src/index.ts'
			} );
		} );

		it( 'should remove default unnecessary fields from `package.json`', async () => {
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
							},
							private: true
						} )
					}
				}
			} );

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.writeJson ).toHaveBeenCalledTimes( 1 );

			const input = stubs.writeJson.mock.calls[ 0 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
			expect( input[ 1 ] ).to.deep.equal( {
				name: 'ckeditor5-foo',
				version: '1.0.0',
				description: 'Example package.',
				dependencies: {
					'ckeditor5': '^37.1.0'
				},
				main: 'src/index.ts'
			} );
		} );

		it( 'should remove provided unnecessary fields from `package.json`', async () => {
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

			await cleanUpPackages( {
				packagesDirectory: 'release',
				packageJsonFieldsToRemove: [ 'author' ]
			} );

			expect( stubs.writeJson ).toHaveBeenCalledTimes( 1 );

			const input = stubs.writeJson.mock.calls[ 0 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
			expect( input[ 1 ] ).to.deep.equal( {
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

		it( 'should keep postinstall hook in `package.json` when preservePostInstallHook is set to true', async () => {
			mockFs( {
				'release': {
					'ckeditor5-foo': {
						'package.json': JSON.stringify( {
							scripts: {
								'postinstall': 'node my-node-script.js',
								'build': 'tsc -p ./tsconfig.json',
								'dll:build': 'webpack'
							}
						} )
					}
				}
			} );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				preservePostInstallHook: true
			} );
			const input = stubs.writeJson.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.deep.equal( {
				scripts: {
					'postinstall': 'node my-node-script.js'
				}
			} );
		} );

		it( 'should not remove scripts unless it is explicitly specified in packageJsonFieldsToRemove', async () => {
			mockFs( {
				'release': {
					'ckeditor5-foo': {
						'package.json': JSON.stringify( {
							author: 'author',
							scripts: {
								'postinstall': 'node my-node-script.js',
								'build': 'tsc -p ./tsconfig.json',
								'dll:build': 'webpack'
							}
						} )
					}
				}
			} );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				preservePostInstallHook: true,
				packageJsonFieldsToRemove: [
					'author'
				]
			} );

			const input = stubs.writeJson.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.deep.equal( {
				scripts: {
					'postinstall': 'node my-node-script.js',
					'build': 'tsc -p ./tsconfig.json',
					'dll:build': 'webpack'
				}
			} );
		} );

		it( 'should accept a callback for packageJsonFieldsToRemove', async () => {
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
								'postinstall': 'node my-node-script.js',
								'build': 'tsc -p ./tsconfig.json',
								'dll:build': 'webpack'
							}
						} )
					}
				}
			} );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				packageJsonFieldsToRemove: defaults => [
					...defaults,
					'author'
				]
			} );

			const input = stubs.writeJson.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.deep.equal( {
				description: 'Example package.',
				main: 'src/index.ts',
				name: 'ckeditor5-foo',
				version: '1.0.0',
				dependencies: {
					'ckeditor5': '^37.1.0'
				}
			} );
		} );
	} );
} );

function getPathTo( path ) {
	return upath.join( process.cwd(), path );
}

async function getAllPaths() {
	return ( await glob( '**', {
		absolute: true,
		dot: true
	} ) ).map( upath.normalize );
}
