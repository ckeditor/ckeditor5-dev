/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeParameterReflection, Comment } = require( 'typedoc' );

/**
 * The `typedoc-plugin-tag-event` collects event definitions from the `@eventName` tag and assigns them as the class children.
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

		// Then, try to find a parent class to properly associate the event in the hierarchy.
		const classReflection = findClassForEvent( eventName, reflection );

		if ( !classReflection ) {
			const symbol = context.project.getSymbolFromReflection( reflection );
			const node = symbol.declarations[ 0 ];

			context.logger.warn( `Skipping unsupported "${ eventName }" event.`, node );

			continue;
		}

		// Create a new reflection object for the event, but take into account the found class as the new scope. It will cause the newly
		// created event reflection to be automatically associated as a child of this class.
		const eventReflection = context
			.withScope( classReflection )
			.createDeclarationReflection(
				ReflectionKind.ObjectLiteral,
				undefined,
				undefined,
				`event:${ eventName }`
			);

		eventReflection.kindString = 'Event';

		// Map each found `@param` tag to the type parameter reflection.
		const typeParameters = reflection.comment.getTags( '@param' ).map( tag => {
			const param = new TypeParameterReflection( tag.name, undefined, undefined, eventReflection );

			param.type = context.converter.convertType( context.withScope( param ) );
			param.comment = new Comment( tag.content );

			return param;
		} );

		if ( typeParameters.length ) {
			eventReflection.typeParameters = typeParameters;
		}

		// Copy comment summary. The `blockTags` property from the comment is not needed, as it has been already mapped to the type
		// parameters.
		eventReflection.comment = new Comment( Comment.cloneDisplayParts( reflection.comment.summary ) );

		// Copy the source location as it is the same as the location of the reflection containing the event.
		eventReflection.sources = [ ...reflection.sources ];
	}
}

/**
 * Tries to find the best parent class for the event. The algorithm is as follows:
 *
 * (1) First, it traverses the ancestors of the reflection containing the specified event and searches for a class that fires this event.
 * (2) Otherwise, it tries to find the first default class within the same module.
 *
 * It returns `null` if no matching class is found.
 *
 * @param {String} eventName The event name to be searched in the reflection parent.
 * @param {require('typedoc').Reflection} reflection The reflection that contains the event name.
 * @returns {require('typedoc').Reflection|null}
 */
function findClassForEvent( eventName, reflection ) {
	return findReflection( reflection, isClassThatFiresEvent( eventName ) ) ||
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
