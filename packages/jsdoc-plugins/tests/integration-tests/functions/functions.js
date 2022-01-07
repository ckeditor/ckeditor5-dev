/**
 * @license Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const extractApiDocs = require( '../_utils/extract-api-docs' );
const { cloneDeep } = require( 'lodash' );
const { expect } = require( 'chai' );

describe( 'integration test/exported-functions', () => {
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

	describe( 'exported functions', () => {
		it( '3 doclets should be generated', () => {
			expect( apiDocs.length ).to.equal( 3 );
		} );

		it( 'doclet for the default export function should be generated', () => {
			const fooDoclet = apiDocs.find( d => d.longname === 'module:foo~foo' );

			expect( fooDoclet ).to.be.an( 'object' );

			expect( fooDoclet ).to.deep.equal( {
				comment: '/**\n * Function `foo`.\n */',
				meta: {
					filename: 'input.jsdoc'
				},
				description: 'Function `foo`.',
				name: 'foo',
				longname: 'module:foo~foo',
				kind: 'function',
				memberof: 'module:foo',
				scope: 'inner'
			} );
		} );

		it( 'doclet for the exported function should be generated', () => {
			const barDoclet = apiDocs.find( d => d.longname === 'module:foo~bar' );

			expect( barDoclet ).to.be.an( 'object' );

			expect( barDoclet ).to.deep.equal( {
				comment: '/**\n * Helper function `bar`.\n */',
				meta: {
					filename: 'input.jsdoc'
				},
				description: 'Helper function `bar`.',
				name: 'bar',
				longname: 'module:foo~bar',
				kind: 'function',
				memberof: 'module:foo',
				scope: 'inner'
			} );
		} );
	} );
} );
