/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeParameterReflection, ReferenceType, Comment } = require( 'typedoc' );

/**
 * The `typedoc-plugin-event-param-fixer` creates the `eventInfo` parameter that is of type `EventInfo` class, and then inserts it as the
 * first parameter for each found event reflection.
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEventEnd );
	}
};

function onEventEnd( context ) {
	// Try to find the `EventInfo` class from the `utils/eventinfo` module.
	const eventInfoClass = context.project.getChildByName( [ 'utils/eventinfo', 'EventInfo' ] );

	if ( !eventInfoClass ) {
		context.logger.warn( 'Unable to find the "EventInfo" class.' );

		return;
	}

	// Get the reference to the `EventInfo` class. The reference is constant, it is the same in the whole project, so let's create it once.
	const eventInfoClassReference = ReferenceType.createResolvedReference( 'EventInfo', eventInfoClass, context.project );

	// Get all resolved reflections that could be an event.
	const eventKind = ReflectionKind.ObjectLiteral | ReflectionKind.TypeAlias;
	const reflections = context.project.getReflectionsByKind( eventKind );

	// Then, for each potential event reflection...
	for ( const reflection of reflections ) {
		// ...skip it, if it is not an event.
		if ( reflection.kindString !== 'Event' ) {
			continue;
		}

		// Set the `EventInfo` class reference as the type of the `eventInfo` parameter. It is not needed to set the whole class (including
		// its children) as a type for the parameter, but it is enough to set just the references to this class.
		const eventInfoParameter = new TypeParameterReflection( 'eventInfo', eventInfoClassReference, undefined, reflection );

		eventInfoParameter.comment = new Comment( [
			{
				kind: 'text',
				text: 'An object containing information about the fired event.'
			}
		] );

		// The first parameter for each event is always the `eventInfo`.
		reflection.typeParameters = reflection.typeParameters || [];
		reflection.typeParameters.unshift( eventInfoParameter );
	}
}
