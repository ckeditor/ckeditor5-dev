/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const extractApiDocs = require( '../_utils/extract-api-docs' );
const { cloneDeep } = require( 'lodash' );
const { expect } = require( 'chai' );

describe( 'integration test/class-static-methods', () => {
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

	describe( 'class static methods', () => {
		it( 'doclets should be generated', () => {
			expect( apiDocs.length ).to.equal( 3 );
		} );

		it( 'doclet for static property (getter + setter) should be generated', () => {
			const doclet = apiDocs.find( doclet => doclet.longname === 'module:foo/bar~Foo.foo' );

			expect( doclet ).to.deep.equal( {
				comment: '/**\n\t * Static foo property.\n\t */',
				meta: { filename: 'input.jsdoc' },
				description: 'Static foo property.',
				name: 'foo',
				longname: 'module:foo/bar~Foo.foo',
				kind: 'member',
				memberof: 'module:foo/bar~Foo',
				scope: 'static',
				params: []
			} );
		} );

		it( 'doclet for static method should be generated', () => {
			const doclet = apiDocs.find( doclet => doclet.longname === 'module:foo/bar~Foo.get' );

			expect( doclet ).to.deep.equal( {
				comment: '/**\n\t * Gets some value.\n\t */',
				meta: { filename: 'input.jsdoc' },
				description: 'Gets some value.',
				name: 'get',
				longname: 'module:foo/bar~Foo.get',
				kind: 'function',
				memberof: 'module:foo/bar~Foo',
				scope: 'static',
				params: []
			} );
		} );
	} );
} );
