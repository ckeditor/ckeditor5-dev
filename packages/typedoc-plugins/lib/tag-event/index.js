/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeParameterReflection, Comment, ReflectionFlag, IntrinsicType } = require( 'typedoc' );
const { getTarget } = require( '../utils' );

/**
 * The `typedoc-plugin-tag-event` collects event definitions from the `@eventName` tag and assigns them as the children of the class or
 * the `Observable` interface.
 *
 * We are not using the `@event` tag, known from the JSDoc specification, because it has a special meaning in the TypeDoc, and it would be
 * difficult to get it to work as we expect. This is why we have introduced a support for the custom `@eventName` tag, which now replaces
 * the old `@event` tag.
 *
 * To correctly define an event, it must be associated with the exported type that describes that event, with the `name` and `args`
 * properties. The value for the `@eventName` tag must be a valid link to a class or to an interface, either a relative or an absolute one.
 *
 * To correctly define the event parameters, they must be defined in the `args` property. The `args` property is an array, where each item
 * describes a parameter that event emits. Item can be either of a primitive type, or a custom type that has own definition.
 *
 * Example:
 *
 * ```ts
 * 		export class ExampleClass {}
 *
 * 		export type ExampleType = {
 * 			name: string;
 * 		};
 *
 * 		/**
 * 		 * An event associated with exported type.
 * 		 *
 * 		 * @eventName ~ExampleClass#foo-event
 * 		 * @param p1 Description for first param.
 * 		 * @param p2 Description for second param.
 * 		 * @param p3 Description for third param.
 * 		 * /
 * 		export type FooEvent = {
 * 			name: string;
 * 			args: [
 * 				p1: string;
 * 				p2: number;
 * 				p3: ExampleType;
 * 			];
 * 		};
 * ```
 *
 * Exported type may contain multiple `@eventName` tags to re-use the same type to create many different events.
 */
module.exports = {
	load( app ) {
		// Search for the `@eventName` tag when the whole project has been converted. It is required that the parent-child relationship
		// already exists.
		app.converter.on( Converter.EVENT_END, onEventEnd );
	}
};

function onEventEnd( context ) {
	// Get all resolved reflections that could be an event.
	const eventKind = ReflectionKind.ObjectLiteral | ReflectionKind.TypeAlias;
	const reflections = context.project.getReflectionsByKind( eventKind );

	// Then, for each potential event reflection...
	for ( const reflection of reflections ) {
		// ...skip it, if it does not contain the `@eventName` tag.
		if ( !reflection.comment || !reflection.comment.getTag( '@eventName' ) ) {
			continue;
		}

		// Otherwise, if there is at least one `@eventName` tag found in a comment, extract the link to the event owner for each found tag.
		// The link to the event owner is the string just after the tag name.
		//
		// Example: for the `@eventName ~ExampleClass#foo-event`, the event link would be `~ExampleClass#foo-event`.
		const eventTags = reflection.comment.getTags( '@eventName' ).map( tag => tag.content[ 0 ].text );

		// Then, try to find the owner reflection for each found tag to properly associate the event in the hierarchy.
		for ( const eventTag of eventTags ) {
			const [ eventOwner, eventName ] = eventTag.split( '#' );
			const ownerReflection = getTarget( reflection, eventOwner );

			// The owner for an event can be either a class or an interface.
			if ( !isClassOrInterface( ownerReflection ) ) {
				const symbol = context.project.getSymbolFromReflection( reflection );
				const node = symbol.declarations[ 0 ];

				context.logger.warn( `Skipping unsupported "${ eventTag }" event.`, node );

				continue;
			}

			// Create a new context for the event by taking into account the found owner reflection as the new scope. It will cause
			// the newly created event reflection to be automatically associated as a child of this owner.
			const ownerContext = context.withScope( ownerReflection );

			createNewEventReflection( ownerContext, reflection, eventName );
		}
	}
}

/**
 * Checks if the found owner reflection for an event is either an interface or a class.
 *
 * @param {require('typedoc').Reflection} reflection The found owner reflection for an event.
 * @returns {Boolean}
 */
function isClassOrInterface( reflection ) {
	if ( !reflection ) {
		return false;
	}

	if ( reflection.kindString !== 'Class' && reflection.kindString !== 'Interface' ) {
		return false;
	}

	return true;
}

/**
 * Creates new reflection for the provided event name, in the event owner's scope.
 *
 * @param {require('typedoc').Context} ownerContext
 * @param {require('typedoc').Reflection} reflection
 * @param {String} eventName
 */
function createNewEventReflection( ownerContext, reflection, eventName ) {
	// Create a new reflection object for the event from the provided scope.
	const eventReflection = ownerContext.createDeclarationReflection(
		ReflectionKind.ObjectLiteral,
		undefined,
		undefined,
		normalizeEventName( eventName )
	);

	eventReflection.kindString = 'Event';

	const paramTags = reflection.comment.getTags( '@param' );

	// Try to find parameters for the event, which are defined in the `args` tuple.
	const argsReflection = getArgsTuple( reflection );

	// Then, for each found parameter, get its type and try to find the description from the `@param` tag.
	const typeParameters = argsReflection.map( ( arg, index ) => {
		let argName;

		// If the parameter is not anonymous, take its name.
		if ( arg.element ) {
			argName = arg.name;
		}
		// Otherwise, take the name from the `@param` tag at the current index (if it exists).
		else if ( paramTags[ index ] ) {
			argName = paramTags[ index ].name;
		}
		// Otherwise, just set the fallback name to show something.
		else {
			argName = '<anonymous>';
		}

		const param = new TypeParameterReflection( argName, undefined, undefined, eventReflection );

		param.type = arg;

		// TypeDoc does not mark an optional parameter, so let's do it manually.
		if ( param.type.isOptional || param.type.type === 'optional' ) {
			param.setFlag( ReflectionFlag.Optional );
		}

		const comment = paramTags.find( tag => tag.name === argName );

		if ( comment ) {
			param.comment = new Comment( comment.content );
		}

		return param;
	} );

	if ( typeParameters.length ) {
		eventReflection.typeParameters = typeParameters;
	}

	// Copy the whole comment. In addition to the comment summary, it can contain other useful data (i.e. block tags, modifier tags).
	eventReflection.comment = reflection.comment.clone();

	// Copy the source location as it is the same as the location of the reflection containing the event.
	eventReflection.sources = [ ...reflection.sources ];
}

/**
 * Tries to find the `args` tuple, that is associated with the event and it contains all event parameters.
 *
 * @param {require('typedoc').Reflection} reflection The reflection that contains the event name.
 * @returns {Array.<require('typedoc').Reflection>}
 */
function getArgsTuple( reflection ) {
	const typeArguments = reflection.type.typeArguments || [];

	// The target reflection, that defines the `args` tuple, might be located in one of two (or both) places:
	// - in the type arguments,
	// - in the type of the reflection.
	//
	// Let's take the type arguments first, if they exist, because if the `args` tuple is defined there, this seems more desirable.
	const targetTypeReflections = [
		...typeArguments.flatMap( type => getTargetTypeReflections( type ) ),
		...getTargetTypeReflections( reflection.type )
	];

	// Then, try to find the `args` tuple.
	const argsTuple = targetTypeReflections
		.filter( type => {
			// The `args` tuple is one of the reflection child. Filter out those that don't contain any children.
			if ( !type.declaration || !type.declaration.children ) {
				return false;
			}

			return true;
		} )
		.flatMap( type => type.declaration.children )
		.find( property => property.name === 'args' );

	if ( !argsTuple ) {
		return [];
	}

	// If the `args` tuple is of a "complex" type (e.g. a conditional type) without ready-to-process elements,
	// just consider it as any type for now.
	if ( !argsTuple.type.elements ) {
		return [ new IntrinsicType( 'any' ) ];
	}

	return argsTuple.type.elements;
}

/**
 * Returns all type reflections for the specified reflection.
 *
 * If the type reflection is a reference to another one, it recursively walks deep until the final declaration is reached.
 * If the type reflection is an intersection, all member reflections are recursively checked.
 *
 * @param {require('typedoc').Reflection} reflectionType
 * @returns {Array.<require('typedoc').Reflection>}
 */
function getTargetTypeReflections( reflectionType ) {
	if ( !reflectionType ) {
		return [];
	}

	if ( reflectionType.type === 'reference' ) {
		if ( !reflectionType.reflection ) {
			return [];
		}

		return getTargetTypeReflections( reflectionType.reflection.type );
	}

	if ( reflectionType.type === 'intersection' ) {
		return reflectionType.types.flatMap( type => getTargetTypeReflections( type ) );
	}

	return [ reflectionType ];
}

/**
 * Returns the normalized event name to make sure that it always starts with the "event:" prefix.
 *
 * @param {String} eventName
 * @returns {String}
 */
function normalizeEventName( eventName ) {
	if ( eventName.startsWith( 'event:' ) ) {
		return eventName;
	}

	return `event:${ eventName }`;
}
