/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import upath from 'upath';
import { glob } from 'glob';
import mockFs from 'mock-fs';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

describe( 'cleanUpPackages()', () => {
	let cleanUpPackages, stubs;

	beforeEach( async () => {
		// Calls to `fs` and `glob` are stubbed, but they are passed through to the real implementation because we want to test the
		// real behavior of the script. The whole filesystem is mocked by the `mock-fs` util for testing purposes. A virtual project is
		// prepared in tests on this mocked filesystem.
		vi.doMock( 'glob', () => ( {
			glob: vi.fn().mockImplementation( glob )
		} ) );
		vi.doMock( 'fs/promises', () => ( {
			default: {
				readFile: vi.fn().mockImplementation( fs.readFile ),
				writeFile: vi.fn().mockImplementation( fs.writeFile ),
				rm: vi.fn().mockImplementation( fs.rm ),
				readdir: vi.fn().mockImplementation( fs.readdir )
			}
		} ) );
		vi.doMock( '@ckeditor/ckeditor5-dev-utils', () => ( {
			workspaces: {
				findPathsToPackages: vi.fn().mockImplementation( workspaces.findPathsToPackages )
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
			expect( stubs.readFile ).toHaveBeenCalledTimes( 2 );

			let input = stubs.readFile.mock.calls[ 0 ];
			let call = stubs.readFile.mock.results[ 0 ];

			expect( await call.value ).to.equal( JSON.stringify( { name: 'ckeditor5-foo' } ) );
			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );

			input = stubs.readFile.mock.calls[ 1 ];
			call = stubs.readFile.mock.results[ 1 ];

			expect( await call.value ).to.equal( JSON.stringify( { name: 'ckeditor5-bar' } ) );
			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-bar/package.json' ) );

			// Writing `package.json`.
			expect( stubs.writeFile ).toHaveBeenCalledTimes( 2 );

			input = stubs.writeFile.mock.calls[ 0 ];

			expect( upath.normalize( input[ 0 ] ) ).to.equal( getPathTo( 'release/ckeditor5-foo/package.json' ) );

			input = stubs.writeFile.mock.calls[ 1 ];

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
			}, null, 2 ) );
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
			}, null, 2 ) );
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
			}, null, 2 ) );
		} );

		it( 'should remove deeply nested unnecessary fields from `package.json`', async () => {
			mockFs( {
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
			} );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				packageJsonFieldsToRemove: [ 'engines.pnpm', 'engines.yarn' ]
			} );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				engines: {
					node: '>=24.11.0'
				}
			}, null, 2 ) );
		} );

		it( 'should keep nested field if it does not exist or it targets non-object field', async () => {
			mockFs( {
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
			} );

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
			}, null, 2 ) );
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
			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				scripts: {
					'postinstall': 'node my-node-script.js'
				}
			}, null, 2 ) );
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

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				scripts: {
					'postinstall': 'node my-node-script.js',
					'build': 'tsc -p ./tsconfig.json',
					'dll:build': 'webpack'
				}
			}, null, 2 ) );
		} );

		it( 'should not crash when scripts are not set but preservePostInstallHook is set to true', async () => {
			mockFs( {
				'release': {
					'ckeditor5-foo': {
						'package.json': JSON.stringify( {
							author: 'author'
						} )
					}
				}
			} );

			await cleanUpPackages( {
				packagesDirectory: 'release',
				preservePostInstallHook: true
			} );

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				author: 'author'
			}, null, 2 ) );
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

			const input = stubs.writeFile.mock.calls[ 0 ];

			expect( input[ 1 ] ).to.equal( JSON.stringify( {
				name: 'ckeditor5-foo',
				version: '1.0.0',
				description: 'Example package.',
				dependencies: {
					'ckeditor5': '^37.1.0'
				},
				main: 'src/index.ts'
			}, null, 2 ) );
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
