/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const extractApiDocs = require( '../_utils/extract-api-docs' );
const { cloneDeep } = require( 'lodash' );
const { expect } = require( 'chai' );

describe( 'integration test/exported-variables', () => {
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

	describe( 'exported constants and variables', () => {
		it( 'doclet for MAGIC_CONSTANT should be generated', () => {
			const magicConstantDoclet = apiDocs.find( d => d.longname == 'module:engine/magic~MAGIC_CONSTANT' );

			expect( magicConstantDoclet ).to.deep.equal( {
				comment: '/**\n * Magic constant\n */',
				description: 'Magic constant',
				kind: 'constant',
				longname: 'module:engine/magic~MAGIC_CONSTANT',
				memberof: 'module:engine/magic',
				meta: {
					filename: 'input.jsdoc'
				},
				name: 'MAGIC_CONSTANT',
				scope: 'inner'
			} );
		} );

		it( 'doclet for magicVariable should be generated', () => {
			const magicVariableDoclet = apiDocs.find( d => d.longname == 'module:engine/magic.magicVariable' );

			expect( magicVariableDoclet ).to.deep.equal( {
				comment: '/**\n * Magic variable\n */',
				description: 'Magic variable',
				kind: 'member',
				longname: 'module:engine/magic.magicVariable',
				memberof: 'module:engine/magic',
				meta: {
					filename: 'input.jsdoc'
				},
				name: 'magicVariable',
				scope: 'static'
			} );
		} );
	} );
} );
