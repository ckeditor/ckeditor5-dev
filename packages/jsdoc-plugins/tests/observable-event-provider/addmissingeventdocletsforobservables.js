/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const { expect } = require( 'chai' );
const addMissingEventDocletsForObservables = require( '../../lib/observable-event-provider/addmissingeventdocletsforobservables' );

describe( 'jsdoc-plugins/observable-event-provider', () => {
	describe( 'addMissingEventDocletsForObservables()', () => {
		it( 'should provide new event doclet for the observable property', () => {
			const inputDoclets = [ {
				comment: '...',
				meta: {
					range: [
						1861,
						2061
					],
					filename: 'command.js',
					lineno: 56,
					path: '/workspace/ckeditor5/packages/ckeditor5-core/src',
					code: {}
				},
				description: '<p>Flag indicating whether a command is enabled or disabled.</p>',
				observable: true,
				readonly: true,
				kind: 'member',
				name: 'isEnabled',
				type: {
					names: [
						'Boolean'
					]
				},
				longname: 'module:core/command~Command#isEnabled',
				scope: 'instance',
				memberof: 'module:core/command~Command'
			} ];

			const outputDoclets = addMissingEventDocletsForObservables( inputDoclets );

			expect( outputDoclets.length ).to.equal( 2 );
			expect( outputDoclets[ 1 ] ).to.deep.equal( {
				comment: '',
				meta: {
					range: [
						1861,
						2061
					],
					filename: 'command.js',
					lineno: 56,
					path: '/workspace/ckeditor5/packages/ckeditor5-core/src',
					code: {}
				},
				description: '<p>Fired when the <code>isEnabled</code> property changed value.<p>',
				kind: 'event',
				name: 'change:isEnabled',
				longname: 'module:core/command~Command#event:change:isEnabled',
				params: [ {
					type: {
						names: [ 'module:utils/eventinfo~EventInfo' ]
					},
					description: '<p>An object containing information about the fired event.</p>',
					name: 'eventInfo'
				},
				{
					type: {
						names: [ 'String' ]
					},
					description: '<p>Name of the changed property (<code>isEnabled</code>).</p>',
					name: 'name'
				},
				{
					type: {
						names: [ 'Boolean' ]
					},
					description: [
						'<p>New value of the <code>isEnabled</code> property with given key or <code>null</code>, ',
						'if operation should remove property.</p>'
					].join( '' ),
					name: 'value'
				},
				{
					type: {
						names: [ 'Boolean' ]
					},
					description: [
						'<p>Old value of the <code>isEnabled</code> property with given key or <code>null</code>, ',
						'if property was not set before.</p>'
					].join( '' ),
					name: 'oldValue'
				} ],
				scope: 'instance',
				memberof: 'module:core/command~Command'
			} );
		} );

		it( 'should not provide event doclet for an observable property if the doclet already exists', () => {
			const inputDoclets = [ {
				comment: '...',
				meta: {
					range: [
						1861,
						2061
					],
					filename: 'command.js',
					lineno: 56,
					path: '/workspace/ckeditor5/packages/ckeditor5-core/src',
					code: {}
				},
				description: '<p>Flag indicating whether a command is enabled or disabled.</p>',
				observable: true,
				readonly: true,
				kind: 'member',
				name: 'isEnabled',
				type: {
					names: [
						'Boolean'
					]
				},
				longname: 'module:core/command~Command#isEnabled',
				scope: 'instance',
				memberof: 'module:core/command~Command'
			}, {
				kind: 'event',
				longname: 'module:core/command~Command#event:change:isEnabled'
			} ];

			const outputDoclets = addMissingEventDocletsForObservables( inputDoclets );

			expect( outputDoclets.length ).to.equal( 2 );
		} );

		it( 'should add a proper event name to the fires property', () => {
			const inputDoclets = [ {
				comment: '/**\n\t\t * Flag indicating whether a command is enabled or disabled.',
				meta: {
					range: [
						1861,
						2061
					],
					filename: 'command.js',
					lineno: 56,
					path: '/workspace/ckeditor5/packages/ckeditor5-core/src',
					code: {}
				},
				description: '<p>Flag indicating whether a command is enabled or disabled.</p>',
				observable: true,
				readonly: true,
				kind: 'member',
				name: 'isEnabled',
				type: {
					names: [
						'Boolean'
					]
				},
				longname: 'module:core/command~Command#isEnabled',
				scope: 'instance',
				memberof: 'module:core/command~Command'
			} ];

			const outputDoclets = addMissingEventDocletsForObservables( inputDoclets );

			expect( outputDoclets[ 0 ].fires ).to.deep.equal( [
				'module:core/command~Command#event:change:isEnabled'
			] );
		} );

		it( 'should provide new event doclet with `*` type for the observable property that does not specify type', () => {
			const inputDoclets = [ {
				comment: '...',
				meta: {
					range: [
						1861,
						2061
					],
					filename: 'command.js',
					lineno: 56,
					path: '/workspace/ckeditor5/packages/ckeditor5-core/src',
					code: {}
				},
				description: '<p>Flag indicating whether a command is enabled or disabled.</p>',
				observable: true,
				readonly: true,
				kind: 'member',
				name: 'isEnabled',
				longname: 'module:core/command~Command#isEnabled',
				scope: 'instance',
				memberof: 'module:core/command~Command'
			} ];

			const outputDoclets = addMissingEventDocletsForObservables( inputDoclets );

			expect( outputDoclets.length ).to.equal( 2 );
			expect( outputDoclets[ 1 ] ).to.deep.equal( {
				comment: '',
				meta: {
					range: [
						1861,
						2061
					],
					filename: 'command.js',
					lineno: 56,
					path: '/workspace/ckeditor5/packages/ckeditor5-core/src',
					code: {}
				},
				description: '<p>Fired when the <code>isEnabled</code> property changed value.<p>',
				kind: 'event',
				name: 'change:isEnabled',
				longname: 'module:core/command~Command#event:change:isEnabled',
				params: [ {
					type: {
						names: [ 'module:utils/eventinfo~EventInfo' ]
					},
					description: '<p>An object containing information about the fired event.</p>',
					name: 'eventInfo'
				},
				{
					type: {
						names: [ 'String' ]
					},
					description: '<p>Name of the changed property (<code>isEnabled</code>).</p>',
					name: 'name'
				},
				{
					type: {
						names: [ '*' ]
					},
					description: [
						'<p>New value of the <code>isEnabled</code> property with given key or <code>null</code>, ',
						'if operation should remove property.</p>'
					].join( '' ),
					name: 'value'
				},
				{
					type: {
						names: [ '*' ]
					},
					description: [
						'<p>Old value of the <code>isEnabled</code> property with given key or <code>null</code>, ',
						'if property was not set before.</p>'
					].join( '' ),
					name: 'oldValue'
				} ],
				scope: 'instance',
				memberof: 'module:core/command~Command'
			} );
		} );
	} );
} );
