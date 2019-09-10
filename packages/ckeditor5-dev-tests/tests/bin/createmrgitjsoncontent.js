/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );

describe( 'dev-tests/bin/create-mrgit-json', () => {
	let createMrGitJsonContent;

	beforeEach( () => {
		createMrGitJsonContent = require( '../../lib/bin/createmrgitjsoncontent' );
	} );

	it( 'should return a valid mrgit config when no dependency in package.json present', () => {
		const mrgitJson = createMrGitJsonContent( {} );

		expect( mrgitJson ).to.deep.equal( { dependencies: {}, packages: 'packages/' } );
	} );

	it( 'should return an object with dependency names for npm versions of dependencies', () => {
		const mrgitJson = createMrGitJsonContent( {
			dependencies: {
				'@ckeditor/ckeditor5-core': '^0.8.1',
				'@ckeditor/ckeditor5-engine': '0.10.0'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
			}
		} );

		expect( mrgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
				'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
			},
			packages: 'packages/'
		} );
	} );

	it( 'should work with "ckeditor-" prefix', () => {
		const mrgitJson = createMrGitJsonContent( {
			dependencies: {
				'@ckeditor/ckeditor-core': '^0.8.1',
				'@ckeditor/ckeditor-engine': '0.10.0'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
			}
		} );

		expect( mrgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor-core': 'ckeditor/ckeditor-core',
				'@ckeditor/ckeditor-engine': 'ckeditor/ckeditor-engine',
				'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
			},
			packages: 'packages/'
		} );
	} );

	it( 'should return an object with hashed dependency versions for hashed github versions of dependencies', () => {
		const mrgitJson = createMrGitJsonContent( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core#1ca5608',
				'ckeditor5-some-package': 'git@github.com:cksource/ckeditor5-some-package.git#1234567',
				'ckeditor-some-package': 'git@github.com:cksource/ckeditor-some-package.git#abcdef0'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-paragraph': 'ckeditor/ckeditor5-paragraph#a171de3'
			}
		} );

		expect( mrgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core#1ca5608',
				'@ckeditor/ckeditor5-paragraph': 'ckeditor/ckeditor5-paragraph#a171de3',
				'ckeditor5-some-package': 'git@github.com:cksource/ckeditor5-some-package.git#1234567',
				'ckeditor-some-package': 'git@github.com:cksource/ckeditor-some-package.git#abcdef0'
			},
			packages: 'packages/'
		} );
	} );

	it( 'should filter out all non "ckeditor5-*" and all "ckeditor5-dev-*" packages', () => {
		const mrgitJson = createMrGitJsonContent( {
			dependencies: {
				'@scope/package1': 'abc/def#1ca5608',
				'@scope/package2': '^1.1.1',
				'package3': '^2.2.2'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-dev-docs': '^11.0.0'
			}
		} );

		expect( mrgitJson ).to.deep.equal( {
			dependencies: {},
			packages: 'packages/'
		} );
	} );

	it( 'modifies version of specified package (it sets proper commit)', () => {
		const mrgitJson = createMrGitJsonContent( {
			dependencies: {
				'@ckeditor/ckeditor5-core': '^0.8.1',
				'@ckeditor/ckeditor5-engine': '0.10.0'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
			}
		}, {
			packageName: '@ckeditor/ckeditor5-core',
			commit: 'abcd1234'
		} );

		expect( mrgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core#abcd1234',
				'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
				'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
			},
			packages: 'packages/'
		} );
	} );

	it( 'does not modify anything because required "packageName" is not specified', () => {
		const mrgitJson = createMrGitJsonContent( {
			dependencies: {
				'@ckeditor/ckeditor5-core': '^0.8.1',
				'@ckeditor/ckeditor5-engine': '0.10.0'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
			}
		}, {
			packageName: '@ckeditor/ckeditor5-utils',
			commit: 'abcd1234'
		} );

		expect( mrgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
				'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
			},
			packages: 'packages/'
		} );
	} );

	describe( 'forked repository', () => {
		it( 'allows using forked repository (without specifying a commit)', () => {
			const mrgitJson = createMrGitJsonContent( {
				dependencies: {
					'@ckeditor/ckeditor5-core': '^0.8.1',
					'@ckeditor/ckeditor5-engine': '0.10.0'
				},
				devDependencies: {
					'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
				}
			}, {
				packageName: '@ckeditor/ckeditor5-core',
				repository: 'foo/bar'
			} );

			expect( mrgitJson ).to.deep.equal( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'foo/bar',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
				},
				packages: 'packages/'
			} );
		} );

		it( 'allows using forked repository (with setting a proper commit)', () => {
			const mrgitJson = createMrGitJsonContent( {
				dependencies: {
					'@ckeditor/ckeditor5-core': '^0.8.1',
					'@ckeditor/ckeditor5-engine': '0.10.0'
				},
				devDependencies: {
					'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
				}
			}, {
				packageName: '@ckeditor/ckeditor5-core',
				repository: 'foo/bar',
				commit: 'abcd1234'
			} );

			expect( mrgitJson ).to.deep.equal( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'foo/bar#abcd1234',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
				},
				packages: 'packages/'
			} );
		} );

		it( 'does not modify anything because required "packageName" is not specified', () => {
			const mrgitJson = createMrGitJsonContent( {
				dependencies: {
					'@ckeditor/ckeditor5-core': '^0.8.1',
					'@ckeditor/ckeditor5-engine': '0.10.0'
				},
				devDependencies: {
					'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
				}
			}, {
				packageName: '@ckeditor/ckeditor5-utils',
				repository: 'foo/bar'
			} );

			expect( mrgitJson ).to.deep.equal( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
				},
				packages: 'packages/'
			} );
		} );

		it( 'removes `options.repository` value if the repository belongs to our ecosystem', () => {
			const options = {
				packageName: '@ckeditor/ckeditor5-core',
				repository: 'ckeditor/ckeditor5-core'
			};

			const mrgitJson = createMrGitJsonContent( {
				dependencies: {
					'@ckeditor/ckeditor5-core': '^0.8.1',
					'@ckeditor/ckeditor5-engine': '0.10.0'
				},
				devDependencies: {
					'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
				}
			}, options );

			expect( mrgitJson ).to.deep.equal( {
				dependencies: {
					'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
					'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
				},
				packages: 'packages/'
			} );

			expect( options.repository ).to.be.undefined;
		} );
	} );
} );
