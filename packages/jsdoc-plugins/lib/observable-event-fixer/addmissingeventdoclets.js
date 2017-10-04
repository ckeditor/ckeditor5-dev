/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const {	cloneDeep } = require( 'lodash' );

module.exports = function addMissingEventDoclets( doclets ) {
	doclets = fixFireTag( doclets );

	const observableEvents = getObservableEvents( doclets );

	const newDoclets = createMissingDoclets( doclets, observableEvents );

	return doclets.concat( newDoclets );
};

function fixFireTag( doclets ) {
	return doclets.map( doclet => {
		if ( !doclet.observable ) {
			return doclet;
		}

		const newDoclet = cloneDeep( doclet );
		const eventName = newDoclet.memberof + '#event:change:' + newDoclet.name;

		if ( !newDoclet.fires ) {
			newDoclet.fires = [];
		}

		if ( !newDoclet.fires.includes( eventName ) ) {
			newDoclet.fires.push( eventName );
		}

		return newDoclet;
	} );
}

function getObservableEvents( doclets ) {
	return doclets
		.filter( doclet => doclet.observable )
		.map( observableDoclet => {
			const eventName = observableDoclet.memberof + '#event:change:' + observableDoclet.name;

			return {
				name: eventName,
				method: observableDoclet
			};
		} );
}

function createMissingDoclets( doclets, observableEvents ) {
	const eventLongNames = doclets.filter( d => d.kind === 'event' ).map( d => d.longname );

	return observableEvents
		// Skip for existing events.
		.filter( observableEvent => !eventLongNames.includes( observableEvent.name ) )
		.map( observableEvent => {
			const originalMethod = observableEvent.method;

			const typeNames = originalMethod.type ?
				originalMethod.type.names :
				[ '*' ];

			return {
				comment: '',
				meta: cloneDeep( originalMethod.meta ),
				description: '',
				kind: 'event',
				name: 'change:' + originalMethod.name,
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
					description: '<p>Name of the fired method</p>',
					name: 'eventName'
				},
				{
					type: {
						names: [ ...typeNames ]
					},
					description: [
						'<p>New value of the attribute with given key or <code>null</code>, ',
						'if operation should remove attribute.</p>'
					].join( '' ),
					name: 'value'
				},
				{
					type: {
						names: [ ...typeNames ]
					},
					description: '<p>Old value of the attribute with given key or <code>null</code>, if attribute was not set before.</p>',
					name: 'oldValue'
				} ],
				memberof: originalMethod.memberof,
				longname: observableEvent.name,
				scope: 'instance'
			};
		} );
}
