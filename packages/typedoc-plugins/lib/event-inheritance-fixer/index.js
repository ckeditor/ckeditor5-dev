/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, ReferenceType } = require( 'typedoc' );

/**
 * The `typedoc-plugin-event-inheritance-fixer` takes care of inheriting events, which are not handled by TypeDoc by default.
 *
 * Event can be inherited from a class or from an interface. If a class or an interface fires an event and it is a base for another class or
 * interface, then all events from the base reflection are copied and inserted into each derived reflection.
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEventEnd );
	}
};

function onEventEnd( context ) {
	// Event can be assigned as a child to a class or to an interface.
	const reflections = context.project.getReflectionsByKind( ReflectionKind.Class | ReflectionKind.Interface );

	for ( const reflection of reflections ) {
		// If an interface does not contain any children, skip it.
		if ( !reflection.children ) {
			continue;
		}

		const eventReflections = reflection.children.filter( reflection => reflection.kindString === 'Event' );

		// If class or interface does not fire events, skip it.
		if ( !eventReflections.length ) {
			continue;
		}

		// Otherwise, find all derived classes and interfaces in the whole inheritance chain.
		const derivedReflections = getDerivedReflections( reflection );

		// If current reflection is not extended by another class, skip it.
		if ( !derivedReflections.length ) {
			continue;
		}

		// For each derived reflection...
		for ( const derivedReflection of derivedReflections ) {
			// ...and for each event from the base reflection...
			for ( const eventReflection of eventReflections ) {
				// ...skip processing the event if derived reflection already has it.
				const hasEvent = derivedReflection.children
					.some( child => child.kindString === 'Event' && child.name === eventReflection.name );

				if ( hasEvent ) {
					continue;
				}

				// Otherwise, create and insert new event reflection (with cloned event properties from the base reflection) as the child
				// of the derived reflection.
				const clonedEventReflection = context
					.withScope( derivedReflection )
					.createDeclarationReflection(
						ReflectionKind.ObjectLiteral,
						undefined,
						undefined,
						eventReflection.name
					);

				clonedEventReflection.kindString = 'Event';

				clonedEventReflection.comment = eventReflection.comment.clone();

				clonedEventReflection.sources = [ ...eventReflection.sources ];

				clonedEventReflection.inheritedFrom = ReferenceType.createResolvedReference(
					`${ reflection.name }.${ eventReflection.name }`,
					eventReflection,
					context.project
				);

				if ( eventReflection.typeParameters ) {
					clonedEventReflection.typeParameters = [ ...eventReflection.typeParameters ];
				}
			}
		}
	}
}

/**
 * Finds all derived classes and interfaces from the specified base reflection. It traverses the whole inheritance chain.
 * If the base reflection is not extended or implemented by any other reflection, empty array is returned.
 *
 * @param {require('typedoc').Reflection} reflection The base reflection from which the derived ones will be searched.
 * @returns {Array.<require('typedoc').Reflection>}
 */
function getDerivedReflections( reflection ) {
	const extendedBy = reflection.extendedBy || [];
	const implementedBy = reflection.implementedBy || [];

	return [ ...extendedBy, ...implementedBy ]
		.filter( entry => entry.reflection )
		.flatMap( entry => {
			const derivedReflection = entry.reflection;

			return [
				derivedReflection,
				...getDerivedReflections( derivedReflection )
			];
		} );
}
