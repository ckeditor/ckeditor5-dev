/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const extractApiDocs = require( '../_utils/extract-api-docs' );
const { cloneDeep } = require( 'lodash' );
const { expect } = require( 'chai' );

describe.only( 'integration test/event basics', () => {
	/** @type {Array.<Doclet>} */
	let originalApiDocs;

	/** @type {Array.<Doclet>} */
	let apiDocs;

	before( () => {
		originalApiDocs = extractApiDocs( __dirname );
	} );

	beforeEach( () => {
		apiDocs = cloneDeep( originalApiDocs );
	} );

	describe( 'integration/events basics', () => {
		it( 'should contain 4 doclets', () => {
			expect( apiDocs.length ).to.equal( 4 );
		} );

		it( 'should contain the module doclet', () => {
			const doclet = apiDocs.find( d => d.longname === 'module:foo' );

			expect( doclet ).to.deep.equal( {
				'comment': '/**\n * @module foo\n */',
				'meta': {
					'filename': 'input.jsdoc'
				},
				'kind': 'module',
				'name': 'foo',
				'longname': 'module:foo'
			} );
		} );

		it( 'should include the class doclet', () => {
			const doclet = apiDocs.find( d => d.longname === 'module:foo~Foo' );

			expect( doclet ).to.deep.equal( {
				'comment': '/**\n * The `Foo` class documentation.\n */',
				'meta': {
					'filename': 'input.jsdoc'
				},
				'classdesc': 'The `Foo` class documentation.',
				'name': 'Foo',
				'longname': 'module:foo~Foo',
				'kind': 'class',
				'memberof': 'module:foo',
				'scope': 'inner',
				'descendants': [],
				'augmentsNested': [],
				'mixesNested': [],
				'implementsNested': []
			} );
		} );

		it( 'should include the event doclet', () => {
			const doclet = apiDocs.find( d => d.longname === 'module:foo~Foo#event:move' );

			expect( doclet ).to.deep.equal( {
				'comment': '/**\n * An event documented outside the class.\n *\n * @event move\n */',
				'meta': {
					'filename': 'input.jsdoc'
				},
				'description': 'An event documented outside the class.',
				'kind': 'event',
				'name': 'move',
				'longname': 'module:foo~Foo#event:move',
				'scope': 'inner',
				'memberof': 'module:foo~Foo',
				'params': [
					{
						'type': {
							'names': [
								'module:utils/eventinfo~EventInfo'
							]
						},
						'description': '<p>An object containing information about the fired event.</p>',
						'name': 'eventInfo'
					}
				]
			} );
		} );

		it( 'should include the Foo#bar function firing two events', () => {
			const doclet = apiDocs.find( d => d.longname === 'module:foo~Foo#bar' );

			expect( doclet ).to.deep.equal( {
				'comment': '/**\n\t * Fires the `change` event.\n\t *\n\t * @fires change\n\t * @fires move\n\t */',
				'meta': {
					'filename': 'input.jsdoc'
				},
				'description': 'Fires the `change` event.',
				'fires': [
					'module:foo~Foo#event:change',
					'module:foo~Foo#event:move'
				],
				'name': 'bar',
				'longname': 'module:foo~Foo#bar',
				'kind': 'function',
				'scope': 'instance',
				'memberof': 'module:foo~Foo',
				'params': []
			} );
		} );
	} );
} );
