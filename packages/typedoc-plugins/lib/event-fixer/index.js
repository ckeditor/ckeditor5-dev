/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeParameterReflection, ReferenceType, Comment } = require( 'typedoc' );

/**
 *
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

	// Get all resolved reflections that could be an event.
	const eventKind = ReflectionKind.ObjectLiteral | ReflectionKind.TypeAlias;
	const reflections = context.project.getReflectionsByKind( eventKind );

	// Then, for each potential event reflection...
	for ( const reflection of reflections ) {
		// ...skip it, if it is not an event.
		if ( reflection.kindString !== 'Event' ) {
			continue;
		}

		// Create a reference to the `EventInfo` class...
		const eventInfoClassReference = ReferenceType.createResolvedReference( 'EventInfo', eventInfoClass, context.project );

		// ...and set this reference as the type of the `eventInfo` parameter.
		const eventInfoParameter = new TypeParameterReflection( 'eventInfo', eventInfoClassReference, undefined, reflection );

		eventInfoParameter.comment = new Comment( [
			{
				kind: 'text',
				text: 'An object containing information about the fired event.'
			}
		] );

		// The first parameter for each event is always the `eventInfo`.
		reflection.typeParameters.unshift( eventInfoParameter );
	}
}
