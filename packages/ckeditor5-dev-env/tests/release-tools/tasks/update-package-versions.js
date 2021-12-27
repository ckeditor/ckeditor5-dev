/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const fs = require( 'fs' );
const mockFs = require( 'mock-fs' );
const sinon = require( 'sinon' );

describe( 'updatePackageVersions()', () => {
	const updatePackageVersions = require( '../../../lib/release-tools/tasks/update-package-versions' );
	let consoleStub;

	beforeEach( () => {
		consoleStub = sinon.stub( console, 'log' );
	} );

	afterEach( () => {
		mockFs.restore();
		consoleStub.restore();
	} );

	it( 'does not modify file without dependencies', () => {
		const packageJson = JSON.stringify( {
			'version': '1.0.0'
		}, null, 2 ) + '\n';

		mockFs( {
			'packages': {
				'ckeditor5-foo': {
					'package.json': packageJson
				}
			}
		} );

		updatePackageVersions( [ { path: process.cwd() + '/packages', commit: false } ] );

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		expect( updatedPackageJson ).to.deep.equal( packageJson );
	} );

	it( 'does not modify file with up to date dependencies', () => {
		const packageJson = JSON.stringify( {
			'version': '1.0.0',
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

		updatePackageVersions( [ { path: process.cwd() + '/packages', commit: false } ] );

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		expect( updatedPackageJson ).to.deep.equal( packageJson );
	} );

	it( 'modifies file with outdated dependencies', () => {
		const packageJson = JSON.stringify( {
			'version': '2.0.0',
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

		updatePackageVersions( [ { path: process.cwd() + '/packages', commit: false } ] );

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'version': '2.0.0',
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
			'version': '2.0.0',
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

		updatePackageVersions( [ { path: process.cwd() + '/packages', commit: false } ] );

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'version': '2.0.0',
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
			'version': '2.0.0',
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

		updatePackageVersions( [ { path: process.cwd() + '/packages', commit: false } ] );

		const updatedPackageJsonFoo = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );
		const updatedPackageJsonBar = fs.readFileSync( process.cwd() + '/packages/ckeditor5-bar/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'version': '2.0.0',
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

	it( 'does not update @ckeditor/ckeditor5-dev-* dependencies', () => {
		const packageJson = JSON.stringify( {
			'version': '2.0.0',
			'dependencies': {
				'ckeditor5': '^1.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^1.0.0',
				'@ckeditor/ckeditor5-dev-utils': '^1.0.0'
			}
		}, null, 2 ) + '\n';

		mockFs( {
			'packages': {
				'ckeditor5-foo': {
					'package.json': packageJson
				}
			}
		} );

		updatePackageVersions( [ { path: process.cwd() + '/packages', commit: false } ] );

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'version': '2.0.0',
			'dependencies': {
				'ckeditor5': '^2.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-core': '^2.0.0',
				'@ckeditor/ckeditor5-dev-utils': '^1.0.0'
			}
		}, null, 2 ) + '\n';

		expect( updatedPackageJson ).to.deep.equal( expectedPackageJson );
	} );

	it( 'does not update @ckeditor/ckeditor5-inspector dependencies', () => {
		const packageJson = JSON.stringify( {
			'version': '2.0.0',
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

		updatePackageVersions( [ { path: process.cwd() + '/packages', commit: false } ] );

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'version': '2.0.0',
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

	it( 'does not update dependencies unrelated to ckeditor5', () => {
		const packageJson = JSON.stringify( {
			'version': '2.0.0',
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

		updatePackageVersions( [ { path: process.cwd() + '/packages', commit: false } ] );

		const updatedPackageJson = fs.readFileSync( process.cwd() + '/packages/ckeditor5-foo/package.json', 'utf-8' );

		const expectedPackageJson = JSON.stringify( {
			'version': '2.0.0',
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
