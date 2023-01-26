/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { cloneDeep } = require( 'lodash' );

/**
 * Creates event doclets for observable properties if they're missing.
 * See #285.
 *
 * @param {Array.<Doclet>} doclets
 * @returns {Array.<Doclet>} An array of enhanced doclets.
 */
module.exports = function addMissingEventDocletsForObservables( doclets ) {
	doclets = markFiredEvents( doclets );

	const newEventDoclets = createMissingEventDoclets( doclets );

	return doclets.concat( newEventDoclets );
};

// @param {Array.<Doclet>} doclets
// @returns {Array.<Doclet>} An array of doclets with fixed fires property.
function markFiredEvents( doclets ) {
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

// @param {Array.<Doclet>} doclets
// @returns {Array.<Doclet>} An array of new event doclets.
function createMissingEventDoclets( doclets ) {
	const eventLongNames = doclets.filter( d => d.kind === 'event' ).map( d => d.longname );
	const observableEvents = getObservableEvents( doclets );

	return observableEvents
		// Skip for existing events.
		.filter( observableEvent => !eventLongNames.includes( observableEvent.name ) )
		.map( observableEvent => {
			const originalProperty = observableEvent.property;

			const typeNames = originalProperty.type ?
				originalProperty.type.names :
				[ '*' ];

			const eventDoclet = {
				comment: '',
				meta: cloneDeep( originalProperty.meta ),
				description: `<p>Fired when the <code>${ originalProperty.name }</code> property changed value.<p>`,
				kind: 'event',
				name: 'change:' + originalProperty.name,
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
					description: `<p>Name of the changed property (<code>${ originalProperty.name }</code>).</p>`,
					name: 'name'
				},
				{
					type: {
						names: [ ...typeNames ]
					},
					description: [
						`<p>New value of the <code>${ originalProperty.name }</code> property with given key or <code>null</code>, `,
						'if operation should remove property.</p>'
					].join( '' ),
					name: 'value'
				},
				{
					type: {
						names: [ ...typeNames ]
					},
					description: [
						`<p>Old value of the <code>${ originalProperty.name }</code> property with given key or <code>null</code>, `,
						'if property was not set before.</p>'
					].join( '' ),
					name: 'oldValue'
				} ],
				memberof: originalProperty.memberof,
				longname: observableEvent.name,
				scope: 'instance',
				access: originalProperty.access ? originalProperty.access : 'public'
			};

			if ( originalProperty.inherited ) {
				eventDoclet.inherited = true;
			}

			if ( originalProperty.mixed ) {
				eventDoclet.mixed = true;
			}

			return eventDoclet;
		} );
}

function getObservableEvents( doclets ) {
	return doclets
		.filter( doclet => doclet.observable )
		.map( observableDoclet => {
			const eventName = observableDoclet.memberof + '#event:change:' + observableDoclet.name;

			return {
				name: eventName,
				property: observableDoclet
			};
		} );
}
