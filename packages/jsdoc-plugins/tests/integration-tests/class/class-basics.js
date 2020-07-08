/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const extractApiDocs = require( '../_utils/extract-api-docs' );
const { cloneDeep } = require( 'lodash' );
const { expect } = require( 'chai' );

describe.only( 'integration test/exported-class', () => {
	/** @type {Array.<Doclet>} */
	let originalApiDocs;

	/** @type {Array.<Doclet>} */
	let apiDocs;

	before( async () => {
		originalApiDocs = await extractApiDocs( __dirname );
	} );

	beforeEach( () => {
		apiDocs = cloneDeep( originalApiDocs );
	} );

	it( 'should generate a doclet for class', () => {
		const classDoclets = apiDocs.filter( doclet => doclet.longname === 'module:foo/bar/baz~Foo' );

		expect( classDoclets.length ).to.equal( 1 );

		expect( classDoclets[ 0 ] ).to.deep.equal( {
			comment: '/**\n * Docs for class `Foo`.\n */',
			meta: { filename: 'input.jsdoc' },
			classdesc: 'Docs for class `Foo`.',
			name: 'Foo',
			longname: 'module:foo/bar/baz~Foo',
			kind: 'class',
			scope: 'inner',
			memberof: 'module:foo/bar/baz',
			augmentsNested: [],
			implementsNested: [],
			mixesNested: [],
			descendants: [
				'module:foo/bar/baz~Bar',
				'module:foo/bar/baz~Baz'
			]
		} );
	} );

	it( 'should generate a doclet for a class constructor', () => {
		const constructorDoclets = apiDocs.filter( doclet => doclet.longname === 'module:foo/bar/baz~Foo#constructor' );

		expect( constructorDoclets.length ).to.equal( 1 );

		expect( constructorDoclets[ 0 ] ).to.deep.equal( {
			comment: '/**\n\t * Docs for the constructor.\n\t */',
			meta: { filename: 'input.jsdoc' },
			description: 'Docs for the constructor.',
			name: 'constructor',
			longname: 'module:foo/bar/baz~Foo#constructor',
			kind: 'function',
			memberof: 'module:foo/bar/baz~Foo',
			scope: 'instance',
			params: []
		} );
	} );

	it( 'should generate a doclet for an inherited class', () => {
		const classDoclets = apiDocs.filter( doclet => doclet.longname === 'module:foo/bar/baz~Bar' );

		expect( classDoclets.length ).to.equal( 1 );

		expect( classDoclets[ 0 ] ).to.deep.equal( {
			comment: '/**\n * Docs for the `Bar` class.\n *\n * @extends module:foo/bar/baz~Foo\n */',
			meta: { filename: 'input.jsdoc' },
			classdesc: 'Docs for the `Bar` class.',
			name: 'Bar',
			longname: 'module:foo/bar/baz~Bar',
			kind: 'class',
			scope: 'inner',
			memberof: 'module:foo/bar/baz',
			augments: [
				'module:foo/bar/baz~Foo'
			],
			augmentsNested: [
				'module:foo/bar/baz~Foo'
			],
			implementsNested: [],
			mixesNested: [],
			descendants: []
		} );
	} );

	it( 'should generate a doclet for an inherited class constructor', () => {
		const constructorDoclets = apiDocs.filter( doclet => doclet.longname === 'module:foo/bar/baz~Bar#constructor' );

		expect( constructorDoclets.length ).to.equal( 1 );

		expect( constructorDoclets[ 0 ] ).to.deep.equal( {
			comment: '/**\n\t * @inheritdoc\n\t */',
			meta: { filename: 'input.jsdoc' },
			inheritdoc: '',
			name: 'constructor',
			longname: 'module:foo/bar/baz~Bar#constructor',
			kind: 'function',
			memberof: 'module:foo/bar/baz~Bar',
			scope: 'instance',
			params: []
		} );
	} );

	it( 'should generate a doclet for an inherited class with its own docs', () => {
		const classDoclets = apiDocs.filter( doclet => doclet.longname === 'module:foo/bar/baz~Baz' );

		expect( classDoclets.length ).to.equal( 1 );

		expect( classDoclets[ 0 ] ).to.deep.equal( {
			comment: '/**\n * Docs for the `Baz` class.\n *\n * @extends module:foo/bar/baz~Foo\n */',
			meta: { filename: 'input.jsdoc' },
			classdesc: 'Docs for the `Baz` class.',
			name: 'Baz',
			longname: 'module:foo/bar/baz~Baz',
			kind: 'class',
			scope: 'inner',
			memberof: 'module:foo/bar/baz',
			augments: [
				'module:foo/bar/baz~Foo'
			],
			augmentsNested: [
				'module:foo/bar/baz~Foo'
			],
			implementsNested: [],
			mixesNested: [],
			descendants: []
		} );
	} );

	it( 'should generate a doclet for an inherited class constructor with its own docs', () => {
		const constructorDoclets = apiDocs.filter( doclet => doclet.longname === 'module:foo/bar/baz~Baz#constructor' );

		expect( constructorDoclets.length ).to.equal( 1 );

		expect( constructorDoclets[ 0 ] ).to.deep.equal( {
			comment: '/**\n\t * Docs for the `Baz` class constructor.\n\t */',
			description: 'Docs for the `Baz` class constructor.',
			meta: { filename: 'input.jsdoc' },
			name: 'constructor',
			longname: 'module:foo/bar/baz~Baz#constructor',
			kind: 'function',
			memberof: 'module:foo/bar/baz~Baz',
			scope: 'instance',
			params: []
		} );
	} );
} );
