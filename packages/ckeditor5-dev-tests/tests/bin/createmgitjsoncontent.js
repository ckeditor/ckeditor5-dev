/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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

		expect( mgitJson ).to.deep.equal( { dependencies: {} } );
	} );

	it( 'should return an object with dependency names for npm versions of dependencies', () => {
		const mgitJson = createMgitJson( {
			dependencies: {
				'@ckeditor/ckeditor5-core': '^0.8.1',
				'@ckeditor/ckeditor5-engine': '^0.10.0',
				'@ckeditor/ckeditor5-ui': '^0.9.0',
				'@ckeditor/ckeditor5-utils': '^0.9.1'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-basic-styles': '^0.8.1',
				'@ckeditor/ckeditor5-clipboard': '^0.6.0',
				'@ckeditor/ckeditor5-dev-lint': '^3.1.0',
			}
		} );

		expect( mgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine',
				'@ckeditor/ckeditor5-ui': 'ckeditor/ckeditor5-ui',
				'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils',
				'@ckeditor/ckeditor5-basic-styles': 'ckeditor/ckeditor5-basic-styles',
				'@ckeditor/ckeditor5-clipboard': 'ckeditor/ckeditor5-clipboard'
			}
		} );
	} );

	it( 'should return an object with hashed dependency versions for hashed github versions of dependencies', () => {
		const mgitJson = createMgitJson( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core#1ca5608',
				'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine#e91db91',
				'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils#f67aea1',
				'ckeditor5-some-package': 'git@github.com:cksource/ckeditor5-some-package.git#1234567',
				'ckeditor-some-package': 'git@github.com:cksource/ckeditor-some-package.git#abcdef0'
			},
			devDependencies: {
				'@ckeditor/ckeditor5-dev-lint': '^3.1.0',
				'@ckeditor/ckeditor5-paragraph': 'ckeditor/ckeditor5-paragraph#a171de3',
				'@ckeditor/ckeditor5-typing': 'ckeditor/ckeditor5-typing#3a5e262',
				'@ckeditor/ckeditor5-undo': 'ckeditor/ckeditor5-undo#2843005',
			}
		} );

		expect( mgitJson ).to.deep.equal( {
			dependencies: {
				'@ckeditor/ckeditor5-core': 'ckeditor/ckeditor5-core#1ca5608',
				'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine#e91db91',
				'@ckeditor/ckeditor5-utils': 'ckeditor/ckeditor5-utils#f67aea1',
				'@ckeditor/ckeditor5-paragraph': 'ckeditor/ckeditor5-paragraph#a171de3',
				'@ckeditor/ckeditor5-typing': 'ckeditor/ckeditor5-typing#3a5e262',
				'@ckeditor/ckeditor5-undo': 'ckeditor/ckeditor5-undo#2843005',
				'ckeditor5-some-package': 'git@github.com:cksource/ckeditor5-some-package.git#1234567',
				'ckeditor-some-package': 'git@github.com:cksource/ckeditor-some-package.git#abcdef0'
			}
		} );
	} );
} );
