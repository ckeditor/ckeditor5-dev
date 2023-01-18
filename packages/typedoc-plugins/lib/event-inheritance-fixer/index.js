/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, ReferenceType } = require( 'typedoc' );

/**
 * The `typedoc-plugin-event-inheritance-fixer` takes care of inheriting events, which are not handled by TypeDoc by default.
 *
 * If a class fires an event and this class is a base class for another class, then all events from the base class are copied and inserted
 * into each derived class.
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEventEnd );
	}
};

function onEventEnd( context ) {
	const classReflections = context.project.getReflectionsByKind( ReflectionKind.Class );

	for ( const classReflection of classReflections ) {
		const eventReflections = classReflection.children.filter( reflection => reflection.kindString === 'Event' );

		// If class does not fire events, skip it.
		if ( !eventReflections.length ) {
			continue;
		}

		// Otherwise, find all derived classes in the whole inheritance chain.
		const derivedClassReflections = getDerivedClasses( classReflection );

		// If class is not extended by another class, skip it.
		if ( !derivedClassReflections.length ) {
			continue;
		}

		// For each derived class...
		for ( const derivedClass of derivedClassReflections ) {
			// ...and for each event from the base class...
			for ( const eventReflection of eventReflections ) {
				// ...skip processing the event if derived class already has it.
				const hasEvent = derivedClass.children
					.some( child => child.kindString === 'Event' && child.name === eventReflection.name );

				if ( hasEvent ) {
					continue;
				}

				// Otherwise, create and insert new event reflection (with cloned event properties from the base class) as the child of the
				// derived class.
				const clonedEventReflection = context
					.withScope( derivedClass )
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
					`${ classReflection.name }.${ eventReflection.name }`,
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
 * Finds all derived classes from the specified base class. It traverses the whole inheritance chain, up to the last derived class. If the
 * base class is not extended, empty array is returned.
 *
 * @param {require('typedoc').Reflection} classReflection The base class from which the derived classes will be searched.
 * @returns {Array.<require('typedoc').Reflection>}
 */
function getDerivedClasses( classReflection ) {
	if ( !classReflection.extendedBy ) {
		return [];
	}

	return classReflection.extendedBy.flatMap( entry => {
		const derivedClass = entry.reflection;

		return [
			derivedClass,
			...getDerivedClasses( derivedClass )
		];
	} );
}
