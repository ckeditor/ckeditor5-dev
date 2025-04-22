/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReferenceType,
	ReflectionKind,
	type Context,
	type Application,
	type SomeType,
	type IntersectionType,
	type DeclarationReflection
} from 'typedoc';

/**
 * The `typedoc-plugin-event-inheritance-fixer` takes care of inheriting events, which are not handled by TypeDoc by default.
 *
 * Event can be inherited from a class or from an interface. If a class or an interface fires an event, and it is a base for another
 * class or interface, then all events from the base reflection are copied and inserted into each derived reflection.
 *
 * The plugin takes care of events that are specified in parent classes too.
 */
export default function( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd );
}

function onEventEnd( context: Context ) {
	// Events can be assigned as a child to a class or to an interface (as `#ckeditor5Events`).
	const eventKind = ReflectionKind.Class | ReflectionKind.Interface;
	const reflections = context.project.getReflectionsByKind( eventKind ) as Array<DeclarationReflection>;

	for ( const reflection of reflections ) {
		// Find all parents of a given reflection.
		// Filter function is required in case if the purge plugin removed a reflection.
		const parentReflections = getParentClasses( reflection ).filter( Boolean );

		// Collect all events. The goal is to insert them into a reflection.
		// When using the mixins concept, Typedoc loses the inheritance tree.
		// Hence, we need to look for parent classes manually to determine their events.
		const eventReflections = parentReflections.flatMap( ref => ref.ckeditor5Events || [] );

		// If a class or interface does not fire events, skip it.
		if ( !eventReflections.length ) {
			continue;
		}

		// Otherwise, find all derived classes and interfaces in the whole inheritance chain.
		// Including the current processed reflection allows detecting a class that extends a mixin.
		//
		// ClassA
		//  ⤷ ClassB extends Mixin( ClassA )
		//     ⤷ ClassC extends ClassB
		//
		// The goal is to copy events from `ClassA` when processing `ClassB` to both descendant classes.
		const derivedReflections = [
			reflection,
			...getDerivedReflections( reflection )
		];

		// For each derived reflection...
		for ( const derivedReflection of derivedReflections ) {
			// ...and for each event from the parent reflections...
			for ( const eventReflection of eventReflections ) {
				// ...skip processing the event if a derived reflection already has it.
				// It may happen when processing the `@observable` annotation.
				const hasEvent = derivedReflection.ckeditor5Events
					?.some( existingEventReflection => existingEventReflection.name === eventReflection.name );

				if ( hasEvent ) {
					continue;
				}

				const clonedEventReflection = context.createDeclarationReflection(
					ReflectionKind.Document,
					undefined,
					undefined,
					eventReflection.name
				);

				clonedEventReflection.isCKEditor5Event = true;
				clonedEventReflection.parent = derivedReflection;

				clonedEventReflection.comment = eventReflection.comment?.clone();

				clonedEventReflection.sources = [ ...eventReflection.sources || [] ];

				clonedEventReflection.inheritedFrom = ReferenceType.createResolvedReference(
					`${ eventReflection.parent!.name }.${ eventReflection.name }`,
					eventReflection,
					context.project
				);

				if ( eventReflection.parameters ) {
					clonedEventReflection.parameters = [ ...eventReflection.parameters ];
				}

				derivedReflection.ckeditor5Events ??= [];
				derivedReflection.ckeditor5Events.push( clonedEventReflection );
			}
		}
	}
}

/**
 * Finds all derived classes and interfaces from the specified base reflection. It traverses the whole inheritance chain.
 * If the base reflection is not extended or implemented by any other reflection, an empty array is returned.
 */
function getDerivedReflections( reflection: DeclarationReflection ): Array<DeclarationReflection> {
	const extendedBy = reflection.extendedBy || [];
	const implementedBy = reflection.implementedBy || [];

	return [ ...extendedBy, ...implementedBy ]
		.filter( entry => entry.reflection )
		.flatMap( entry => {
			const derivedReflection = entry.reflection as DeclarationReflection;

			return [
				derivedReflection,
				...getDerivedReflections( derivedReflection )
			];
		} );
}

/**
 * Finds all parent classes from the specified base reflection. It traverses the whole inheritance chain.
 * If the base reflection is not extending, an empty array is returned.
 */
function getParentClasses( reflection: DeclarationReflection ): Array<DeclarationReflection> {
	const extendedTypes = reflection.extendedTypes || [];

	return extendedTypes
		.filter( entry => {
			// Cover: `class extends Mixin( BaseClass )`.
			if ( isIntersectionType( entry ) ) {
				return entry.types.filter( isReferenceType ).length;
			}

			return ( entry as ReferenceType ).reflection;
		} )
		.flatMap( entry => {
			if ( isIntersectionType( entry ) ) {
				const parents = entry.types
					.filter( isReferenceType )
					.map( e => e.reflection as DeclarationReflection );

				return [
					...parents.flatMap( parent => getParentClasses( parent ) ),
					...parents
				];
			}

			const parent = ( entry as ReferenceType ).reflection as DeclarationReflection;

			return [
				...getParentClasses( parent ),
				parent
			];
		} );
}

function isIntersectionType( type: SomeType ): type is IntersectionType {
	return type.type === 'intersection';
}

function isReferenceType( type: SomeType ): type is ReferenceType {
	return type.type === 'reference';
}
