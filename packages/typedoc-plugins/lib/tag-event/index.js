/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeParameterReflection, Comment } = require( 'typedoc' );

/**
 * The `typedoc-plugin-tag-event` collects event definitions from the `@eventName` tag and assigns them as the children of the class or
 * the `Observable` interface.
 *
 * We are not using the `@event` tag, known from the JSDoc specification, because it has a special meaning in the TypeDoc, and it would be
 * difficult to get it to work as we expect. This is why we have introduced a support for the custom `@eventName` tag, which now replaces
 * the old `@event` tag.
 *
 * To correctly define an event, it must be associated with the exported type that describes that event.
 *
 * Example:
 *
 * ```ts
 * 		/**
 * 		 * An event associated with exported type.
 * 		 *
 * 		 * @eventName foo-event
 * 		 * @param {String} p1 Description for first param.
 * 		 * @param {Number} p2 Description for second param.
 * 		 * @param {Boolean} p3 Description for third param.
 * 		 * /
 * 		export type FooEvent = {
 * 			name: string;
 * 			args: [ {
 * 				p1: string;
 * 				p2: number;
 * 				p3: boolean;
 * 			} ];
 * 		};
 * ```
 *
 * TODO: We do not support collecting types of `@param` tags associated with the `@eventName`.
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
				eventName
			);

		eventReflection.kindString = 'Event';

		const argsReflection = getArgsTupple( reflection );

		// Map each found `@param` tag to the type parameter reflection.
		const typeParameters = reflection.comment.getTags( '@param' ).map( tag => {
			const param = new TypeParameterReflection( tag.name, undefined, undefined, eventReflection );

			// TODO: Tests.
			param.type = argsReflection.find( ref => ref.name === tag.name );

			// TODO: What if it returns `null`?
			if ( !param.type ) {
				param.type = context.converter.convertType( context.withScope( param ) );
			}

			param.comment = new Comment( tag.content );

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

function getArgsTupple( reflection ) {
	if ( !reflection.type.declaration ) {
		return [];
	}

	if ( !reflection.type.declaration.children ) {
		return [];
	}

	const x = reflection.type.declaration.children.find( ref => ref.name === 'args' );

	if ( !x ) {
		return [];
	}

	return x.type.elements;
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
