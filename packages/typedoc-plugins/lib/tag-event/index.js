/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeParameterReflection, Comment, ReflectionFlag, IntrinsicType } = require( 'typedoc' );

/**
 * The `typedoc-plugin-tag-event` collects event definitions from the `@eventName` tag and assigns them as the children of the class or
 * the `Observable` interface.
 *
 * We are not using the `@event` tag, known from the JSDoc specification, because it has a special meaning in the TypeDoc, and it would be
 * difficult to get it to work as we expect. This is why we have introduced a support for the custom `@eventName` tag, which now replaces
 * the old `@event` tag.
 *
 * To correctly define an event, it must be associated with the exported type that describes that event, with the `name` and `args`
 * properties.
 *
 * To correctly define the event parameters, they must be defined in the `args` property. The `args` property is an array, where each item
 * describes a parameter that event emits. Item can be either of a primitive type, or a custom type that has own definition.
 *
 * Example:
 *
 * ```ts
 * 		export type ExampleType = {
 * 			name: string;
 * 		};
 *
 * 		/**
 * 		 * An event associated with exported type.
 * 		 *
 * 		 * @eventName foo-event
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

		// Otherwise, if there is the `@eventName` tag found in a comment, extract the event name, which is the string just after the
		// tag name. Example: for the `@eventName foo`, the event name would be `foo`.
		const eventName = reflection.comment.getTag( '@eventName' ).content[ 0 ].text;

		// Then, try to find a parent reflection to properly associate the event in the hierarchy. The parent can be either the `Observable`
		// interface, or a class.
		const parentReflection = findParentForEvent( eventName, reflection );

		if ( !parentReflection ) {
			const symbol = context.project.getSymbolFromReflection( reflection );
			const node = symbol.declarations[ 0 ];

			context.logger.warn( `Skipping unsupported "${ eventName }" event.`, node );

			continue;
		}

		// Create a new reflection object for the event, but take into account the found parent reflection as the new scope. It will cause
		// the newly created event reflection to be automatically associated as a child of this parent.
		const eventReflection = context
			.withScope( parentReflection )
			.createDeclarationReflection(
				ReflectionKind.ObjectLiteral,
				undefined,
				undefined,
				`event:${ eventName }`
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
	// - in the type reflection.
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

			// The reflection that contains the `args` tuple should be a type literal.
			if ( type.declaration.kind !== ReflectionKind.TypeLiteral ) {
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
		return getTargetTypeReflections( reflectionType.reflection.type );
	}

	if ( reflectionType.type === 'intersection' ) {
		return reflectionType.types.flatMap( type => getTargetTypeReflections( type ) );
	}

	return [ reflectionType ];
}

/**
 * Tries to find the best parent reflection for the event. The algorithm is as follows:
 *
 * (1) First, it tries to find the `Observable` interface.
 * (2) Then, if `Observable` interface is not found within the module, it traverses the ancestors of the reflection containing the specified
 *     event and searches for a class that fires this event.
 * (3) Otherwise, it tries to find the first default class within the same module.
 *
 * It returns `null` if no matching parent is found.
 *
 * @param {String} eventName The event name to be searched in the reflection parent.
 * @param {require('typedoc').Reflection} reflection The reflection that contains the event name.
 * @returns {require('typedoc').Reflection|null}
 */
function findParentForEvent( eventName, reflection ) {
	return findReflection( reflection, isObservableInterface ) ||
		findReflection( reflection, isClassThatFiresEvent( eventName ) ) ||
		findReflection( reflection, isDefaultClass );
}

/**
 * Recursively looks for a matching reflection from its ancestors. It not only checks the ancestors, but also all their siblings (children
 * belonging to the same parent).
 *
 * @param {require('typedoc').Reflection} reflection The reflection that is the search starting point.
 * @param {Function} callback The function that gets each reflection and decides if it meets the conditions.
 * @returns {require('typedoc').Reflection|null}
 */
function findReflection( reflection, callback ) {
	if ( !reflection.parent ) {
		return null;
	}

	const found = reflection.parent.children.find( callback );

	if ( found ) {
		return found;
	}

	return findReflection( reflection.parent, callback );
}

/**
 * Checks if the reflection is the `Observable` interface.
 *
 * @param {require('typedoc').Reflection} reflection The reflection to be checked.
 * @returns {Boolean}
 */
function isObservableInterface( reflection ) {
	return reflection.kindString === 'Interface' && reflection.name === 'Observable';
}

/**
 * Returns a function that checks if the reflection is a class that fires the specified event.
 *
 * @param {String} eventName The event name to be searched in the reflection parent.
 * @returns {Function}
 */
function isClassThatFiresEvent( eventName ) {
	return reflection => {
		if ( reflection.kindString !== 'Class' ) {
			return false;
		}

		if ( !reflection.comment ) {
			return false;
		}

		return reflection.comment
			.getTags( '@fires' )
			.some( tag => tag.content[ 0 ].text === eventName );
	};
}

/**
 * Checks if the reflection is a default class.
 *
 * @param {require('typedoc').Reflection} reflection The reflection to be checked.
 * @returns {Boolean}
 */
function isDefaultClass( reflection ) {
	if ( reflection.kindString !== 'Class' ) {
		return false;
	}

	if ( reflection.originalName !== 'default' ) {
		return false;
	}

	return true;
}
