/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import upath from 'upath';
import { glob } from 'glob';
import { fs as memfs, vol } from 'memfs';

describe( 'cleanUpPackages()', () => {
	let cleanUpPackages, stubs;

	beforeEach( async () => {
		// Calls to `fs` and `glob` are stubbed, but they are passed through to real implementations because we want to test the
		// real behavior of the script. The file system itself is an in-memory volume from `memfs`: `fs/promises` resolves to its
		// promise API and `glob` searches it through the `fs` option. `findPathsToPackages()` is re-implemented on top of the same
		// volume, because the real one runs its own `glob` inside `@ckeditor/ckeditor5-dev-utils`, where this test cannot reach.
		// Each test builds its virtual project on the volume with `vol.fromNestedJSON()` in `process.cwd()`. The volume is emptied
		// after each test.
		vi.doMock( 'glob', () => ( {
			glob: vi.fn().mockImplementation( ( pattern, options = {} ) => glob( pattern, { ...options, fs: memfs } ) )
		} ) );
		vi.doMock( 'fs/promises', () => ( {
			default: {
				readFile: vi.fn().mockImplementation( ( ...args ) => memfs.promises.readFile( ...args ) ),
				writeFile: vi.fn().mockImplementation( ( ...args ) => memfs.promises.writeFile( ...args ) ),
				rm: vi.fn().mockImplementation( ( ...args ) => memfs.promises.rm( ...args ) ),
				readdir: vi.fn().mockImplementation( ( ...args ) => memfs.promises.readdir( ...args ) )
			}
		} ) );
		vi.doMock( '@ckeditor/ckeditor5-dev-utils', () => ( {
			workspaces: {
				findPathsToPackages: vi.fn().mockImplementation( findPathsToPackages )
			}
		} ) );

		stubs = {
			...await import( 'glob' ),
			...( await import( 'node:fs/promises' ) ).default,
			findPathsToPackages: ( await import( '@ckeditor/ckeditor5-dev-utils' ) ).workspaces.findPathsToPackages
		};

		cleanUpPackages = ( await import( '../../lib/tasks/cleanuppackages.js' ) ).default;
	} );

	afterEach( () => {
		vi.resetModules();
		vol.reset();
	} );

	describe( 'preparing options', () => {
		it( 'should use provided `cwd` to search for packages', async () => {
			await cleanUpPackages( {
				packagesDirectory: 'release',
				cwd: '/work/another/project'
			} );

			expect( stubs.findPathsToPackages ).toHaveBeenCalledExactlyOnceWith(
				'/work/another/project',
				'release',
				{ includePackageJson: true }
			);
		} );

		it( 'should use `process.cwd()` to search for packages if `cwd` option is not provided', async () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/project' );

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.findPathsToPackages ).toHaveBeenCalledExactlyOnceWith(
				'/work/project',
				'release',
				{ includePackageJson: true }
			);
		} );
	} );

	describe( 'cleaning package directory', () => {
		it( 'should remove empty directories', async () => {
			vol.fromNestedJSON( {
				'release': {
					'ckeditor5-foo': {
						'package.json': JSON.stringify( {
							name: 'ckeditor5-foo'
						} ),
						'ckeditor5-metadata.json': '',
						'src': {}
					}
				}
			}, process.cwd() );

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
			vol.fromNestedJSON( {
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
			}, process.cwd() );

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
			vol.fromNestedJSON( {
				'release': {
					'ckeditor5-foo': {
						'package.json': JSON.stringify( {
							name: 'ckeditor5-foo'
						} ),
						'ckeditor5-metadata.json': ''
					}
				}
			}, process.cwd() );

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
			vol.fromNestedJSON( {
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
			}, process.cwd() );

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
			vol.fromNestedJSON( {
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
			}, process.cwd() );

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
			vol.fromNestedJSON( {
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
			}, process.cwd() );

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
			vol.fromNestedJSON( {
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
			}, process.cwd() );

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
			vol.fromNestedJSON( {
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
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			// The order of the found packages depends on the file system, so the calls are checked regardless of their order.
			const fooPackageJsonPath = getPathTo( 'release/ckeditor5-foo/package.json' );
			const barPackageJsonPath = getPathTo( 'release/ckeditor5-bar/package.json' );

			// Reading `package.json`.
			expect( stubs.readFile ).toHaveBeenCalledTimes( 2 );

			const readCalls = await Promise.all( stubs.readFile.mock.calls.map( async ( [ path ], index ) => {
				return [ upath.normalize( path ), await stubs.readFile.mock.results[ index ].value ];
			} ) );

			expect( readCalls ).toContainEqual( [ fooPackageJsonPath, JSON.stringify( { name: 'ckeditor5-foo' } ) ] );
			expect( readCalls ).toContainEqual( [ barPackageJsonPath, JSON.stringify( { name: 'ckeditor5-bar' } ) ] );

			// Writing `package.json`.
			expect( stubs.writeFile ).toHaveBeenCalledTimes( 2 );

			const writtenPaths = stubs.writeFile.mock.calls.map( ( [ path ] ) => upath.normalize( path ) );

			expect( writtenPaths ).toContain( fooPackageJsonPath );
			expect( writtenPaths ).toContain( barPackageJsonPath );
		} );

		it( 'should not remove any field from `package.json` if all of them are mandatory', async () => {
			vol.fromNestedJSON( {
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
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.writeFile ).toHaveBeenCalledTimes( 1 );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				name: 'ckeditor5-foo',
				version: '1.0.0',
				description: 'Example package.',
				dependencies: {
					'ckeditor5': '^37.1.0'
				},
				main: 'src/index.ts'
			}, null, 2 ) + '\n' );
		} );

		it( 'should remove default unnecessary fields from `package.json`', async () => {
			vol.fromNestedJSON( {
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
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release'
			} );

			expect( stubs.writeFile ).toHaveBeenCalledTimes( 1 );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				name: 'ckeditor5-foo',
				version: '1.0.0',
				description: 'Example package.',
				dependencies: {
					'ckeditor5': '^37.1.0'
				},
				main: 'src/index.ts'
			}, null, 2 ) + '\n' );
		} );

		it( 'should remove provided unnecessary fields from `package.json`', async () => {
			vol.fromNestedJSON( {
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
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				packageJsonFieldsToRemove: [ 'author' ]
			} );

			expect( stubs.writeFile ).toHaveBeenCalledTimes( 1 );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );
			expect( input[ 1 ] ).to.equal( JSON.stringify( {
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
			}, null, 2 ) + '\n' );
		} );

		it( 'should remove deeply nested unnecessary fields from `package.json`', async () => {
			vol.fromNestedJSON( {
				'release': {
					'ckeditor5-foo': {
						'package.json': JSON.stringify( {
							engines: {
								node: '>=24.11.0',
								pnpm: '>=10.14.0',
								yarn: 'Hey, we use pnpm now!'
							}
						} )
					}
				}
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				packageJsonFieldsToRemove: [ 'engines.pnpm', 'engines.yarn' ]
			} );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				engines: {
					node: '>=24.11.0'
				}
			}, null, 2 ) + '\n' );
		} );

		it( 'should keep nested field if it does not exist or it targets non-object field', async () => {
			vol.fromNestedJSON( {
				'release': {
					'ckeditor5-foo': {
						'package.json': JSON.stringify( {
							field: {
								nestedField: [
									'bar'
								]
							}
						} )
					}
				}
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				packageJsonFieldsToRemove: [ 'field.nestedField.length', 'field.invalid' ]
			} );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				field: {
					nestedField: [
						'bar'
					]
				}
			}, null, 2 ) + '\n' );
		} );

		it( 'should keep postinstall hook in `package.json` when preservePostInstallHook is set to true', async () => {
			vol.fromNestedJSON( {
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
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				preservePostInstallHook: true
			} );
			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				scripts: {
					'postinstall': 'node my-node-script.js'
				}
			}, null, 2 ) + '\n' );
		} );

		it( 'should not remove scripts unless it is explicitly specified in packageJsonFieldsToRemove', async () => {
			vol.fromNestedJSON( {
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
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				preservePostInstallHook: true,
				packageJsonFieldsToRemove: [
					'author'
				]
			} );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				scripts: {
					'postinstall': 'node my-node-script.js',
					'build': 'tsc -p ./tsconfig.json',
					'dll:build': 'webpack'
				}
			}, null, 2 ) + '\n' );
		} );

		it( 'should not crash when scripts are not set but preservePostInstallHook is set to true', async () => {
			vol.fromNestedJSON( {
				'release': {
					'ckeditor5-foo': {
						'package.json': JSON.stringify( {
							author: 'author'
						} )
					}
				}
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				preservePostInstallHook: true
			} );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				author: 'author'
			}, null, 2 ) + '\n' );
		} );

		it( 'should accept a callback for packageJsonFieldsToRemove', async () => {
			vol.fromNestedJSON( {
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
			}, process.cwd() );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				packageJsonFieldsToRemove: defaults => [
					...defaults,
					'author'
				]
			} );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				name: 'ckeditor5-foo',
				version: '1.0.0',
				description: 'Example package.',
				dependencies: {
					'ckeditor5': '^37.1.0'
				},
				main: 'src/index.ts'
			}, null, 2 ) + '\n' );
		} );
	} );
} );

/**
 * Mirrors `workspaces.findPathsToPackages()` from `@ckeditor/ckeditor5-dev-utils` for the options used by the task, but searches
 * the in-memory file system.
 *
 * @param {string} cwd
 * @param {string} packagesDirectory
 * @param {object} options
 * @returns {Promise.<Array.<string>>}
 */
async function findPathsToPackages( cwd, packagesDirectory, options ) {
	const paths = await glob( options.includePackageJson ? '*/package.json' : '*/', {
		cwd: upath.join( cwd, packagesDirectory ),
		absolute: true,
		nodir: Boolean( options.includePackageJson ),
		fs: memfs
	} );

	return paths.map( path => upath.normalize( path ) );
}

function getPathTo( path ) {
	return upath.join( process.cwd(), path );
}

async function getAllPaths() {
	return ( await glob( '**', {
		absolute: true,
		dot: true,
		fs: memfs
	} ) ).map( upath.normalize );
}
