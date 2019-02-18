/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );

describe( 'dev-tests/bin/create-mgit-json', () => {
	let createMgitJson;

	beforeEach( () => {
		createMgitJson = require( '../../lib/bin/createmgitjsoncontent' );
	} );

	it( 'should return a valid mgit config when no dependency in package.json present', () => {
		const mgitJson = createMgitJson( {} );

		expect( mgitJson ).to.deep.equal( { dependencies: {}, packages: 'packages/' } );
	} );

	it( 'should return an object with dependency names for npm versions of dependencies', () => {
		const mgitJson = createMgitJson( {
			dependencies: {
				'@ckeditor/ckeditor5-core': '^0.8.1',
				'@ckeditor/ckeditor5-engine': '0.10.0'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-basic-styles': '^0.8.1'
			}
		} );

		expect( mgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
				'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
			},
			packages: 'packages/'
		} );
	} );

	it( 'should return an object with hashed dependency versions for hashed github versions of dependencies', () => {
		const mgitJson = createMgitJson( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core#1ca5608',
				'ckeditor5-some-package': 'git@github.com:cksource/ckeditor5-some-package.git#1234567',
				'ckeditor-some-package': 'git@github.com:cksource/ckeditor-some-package.git#abcdef0'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-paragraph': 'ckeditor/ckeditor5-paragraph#a171de3'
			}
		} );

		expect( mgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core#1ca5608',
				'@ckeditor/ckeditor5-paragraph': 'ckeditor/ckeditor5-paragraph#a171de3',
				'ckeditor5-some-package': 'git@github.com:cksource/ckeditor5-some-package.git#1234567',
				'ckeditor-some-package': 'git@github.com:cksource/ckeditor-some-package.git#abcdef0'
			},
			packages: 'packages/'
		} );
	} );

	it( 'should correctly filter dependencies', () => {
		const mgitJson = createMgitJson( {
			dependencies: {
				'@scope/package1': 'abc/def#1ca5608',
				'@scope/package2': '^1.1.1',
				'package3': '^2.2.2'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-dev-lint': '^3.1.0'
			}
		} );

		expect( mgitJson ).to.deep.equal( {
			dependencies: {},
			packages: 'packages/'
		} );
	} );

	it( 'modifies version of specified package (it sets proper commit)', () => {
		const mgitJson = createMgitJson( {
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

		expect( mgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core#abcd1234',
				'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
				'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles'
			},
			packages: 'packages/'
		} );
	} );
} );
