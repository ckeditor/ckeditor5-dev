/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const extractApiDocs = require( '../_utils/extract-api-docs' );
const { cloneDeep } = require( 'lodash' );
const { expect } = require( 'chai' );

describe( 'integration test/event basics', () => {
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

	describe( 'integration/events basics', () => {
		it( 'should contain 5 doclets', () => {
			expect( apiDocs.length ).to.equal( 5 );
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

		it( 'should include a doclet for event declared outside the class', () => {
			const doclet = apiDocs.find( d => d.longname === 'module:foo~Foo#event:outside' );

			expect( doclet ).to.deep.equal( {
				'comment': '/**\n * An event documented outside the class.\n *\n * @event outside\n */',
				'meta': {
					'filename': 'input.jsdoc'
				},
				'description': 'An event documented outside the class.',
				'kind': 'event',
				'name': 'outside',
				'longname': 'module:foo~Foo#event:outside',
				'scope': 'instance',
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

		it( 'should include a doclet for event declared at the bottom of the class body', () => {
			const doclet = apiDocs.find( d => d.longname === 'module:foo~Foo#event:inside' );

			expect( doclet ).to.deep.equal( {
				'comment': '/**\n\t * An event documented inside the class.\n\t *\n\t * @event inside\n\t */',
				'meta': {
					'filename': 'input.jsdoc'
				},
				'description': 'An event documented inside the class.',
				'kind': 'event',
				'name': 'inside',
				'longname': 'module:foo~Foo#event:inside',
				'scope': 'instance',
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
				'comment': '/**\n\t * Fires two events.\n\t *\n\t * @fires inside\n\t * @fires outside\n\t */',
				'meta': {
					'filename': 'input.jsdoc'
				},
				'description': 'Fires two events.',
				'fires': [
					'module:foo~Foo#event:inside',
					'module:foo~Foo#event:outside'
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
