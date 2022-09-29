/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeParameterReflection, Comment } = require( 'typedoc' );

/**
 * The `typedoc-plugin-tag-event` collects event definitions from the `@eventName` tag.
 *
 * The `@event` tag, known from the JSDoc, has a special meaning in the TypeDoc, and it was difficult to get it to work as we expect. Even
 * setting it to be treated as a block tag (instead of a modifier, by default) didn't work. This is why we introduced support for the
 * `@eventName` tag, which now replaces the old `@event`.
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
	try {
		// Get all resolved reflections when the project has been converted.
		const reflections = context.project.getReflectionsByKind( ReflectionKind.All );

		// Then, for each reflection...
		for ( const reflection of reflections ) {
			// ...skip it, if it does not contain the `@eventName` tag.
			if ( !reflection.comment || !reflection.comment.getTag( '@eventName' ) ) {
				continue;
			}

			// Otherwise, if there is the `@eventName` tag found in a comment, extract the event name, which is the string just after the
			// tag name. Example: for the `@eventName foo`, the event name would be `foo`.
			const eventName = reflection.comment.getTag( '@eventName' ).content[ 0 ].text;

			// Then, try to find a parent reflection to properly associate the event in the hierarchy.
			const parent = findParentForEvent( eventName, reflection );

			// Create the new reflection object for the event, but take into account the new scope. It will cause the newly created event
			// reflection to be automatically associated as a child of its parent.
			const eventReflection = context
				.withScope( parent )
				.createDeclarationReflection(
					ReflectionKind.ObjectLiteral,
					undefined,
					undefined,
					`event:${ eventName }`
				);

			eventReflection.kindString = 'Event';

			// Map each found `@param` tag to the type parameter reflection.
			eventReflection.typeParameters = reflection.comment.getTags( '@param' ).map( tag => {
				const param = new TypeParameterReflection( tag.name, undefined, undefined, eventReflection );

				param.type = context.converter.convertType( context.withScope( param ) );
				param.comment = new Comment( tag.content );

				return param;
			} );

			// Copy comment summary, if it exists. The `blockTags` property from the comment is not needed, as they have been already mapped
			// to the type parameters.
			if ( reflection.comment.summary ) {
				eventReflection.comment = new Comment( Comment.cloneDisplayParts( reflection.comment.summary ) );
			}

			console.log( require( 'util' ).inspect( eventReflection, { showHidden: false, depth: 2, colors: true } ) );
		}
	} catch ( err ) {
		console.log( err );
	}
}

/**
 * Tries to find the best parent for the event.
 *
 * The algorithm is as follows:
 *
 * (1) First, it searches for a reflection on the same nest level as the reflection containing the event. The searched reflection must
 * contain the `@fires` tag with the same name as the event.
 * (2) If no such reflection is found, it tries to find the default class.
 * (3) Otherwise, it simply returns the parent of the reflection containing the event.
 *
 * @param {String} eventName The event name to be searched in the refelction parent.
 * @param {require('typedoc').Reflection} reflection The reflection that contains the event name.
 * @returns {require('typedoc').Reflection}
 */
function findParentForEvent( eventName, reflection ) {
	// todo: probbly it needs a better algorithm
	// 1. collect all children from parent.parent.parent... hierarchy
	// 2. find the first one that fires the event
	// 3. otherwise, find the first default class
	// 4. otherwise, return just the reflection.parent
	if ( reflection.parent.children ) {
		let parentForEvent = reflection.parent.children.find( child => {
			if ( !child.comment ) {
				return false;
			}

			return child.comment
				.getTags( '@fires' )
				.some( tag => tag.content[ 0 ].text === eventName );
		} );

		if ( parentForEvent ) {
			return parentForEvent;
		}

		parentForEvent = reflection.parent.children.find( child => {
			if ( child.kindString !== 'Class' ) {
				return false;
			}

			if ( child.originalName !== 'default' ) {
				return false;
			}

			return true;
		} );

		if ( parentForEvent ) {
			return parentForEvent;
		}
	}

	return reflection.parent;
}
