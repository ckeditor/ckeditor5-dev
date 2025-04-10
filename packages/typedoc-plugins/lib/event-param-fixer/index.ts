/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Comment,
	Converter,
	ReferenceType,
	ReflectionKind,
	ParameterReflection,
	type Context,
	type Application,
	type DeclarationReflection
} from 'typedoc';

/**
 * The `typedoc-plugin-event-param-fixer` creates the `eventInfo` parameter that is of type `EventInfo` class, and then inserts it as the
 * first parameter for each found event reflection.
 */
export default function( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd );
}

function onEventEnd( context: Context ) {
	// Try to find the `EventInfo` class from the `utils/eventinfo` module.
	const eventInfoClass = context.project.getChildByName( [ 'utils/eventinfo', 'EventInfo' ] );

	if ( !eventInfoClass ) {
		context.logger.warn( 'Unable to find the "EventInfo" class.' );

		return;
	}

	// Get the reference to the `EventInfo` class. The reference is constant, it is the same in the whole project, so let's create it once.
	const eventInfoClassReference = ReferenceType.createResolvedReference( 'EventInfo', eventInfoClass, context.project );

	// Get all event reflections.
	const events = context.project.getReflectionsByKind( ReflectionKind.ClassOrInterface )
		.flatMap( ref => ref.ckeditor5Events || [] ) as Array<DeclarationReflection>;

	for ( const eventReflection of events ) {
		// Set the `EventInfo` class reference as the type of the `eventInfo` parameter. It is not needed to set the whole class (including
		// its children) as a type for the parameter, but it is enough to set just the references to this class.
		const eventInfoParameter = new ParameterReflection( 'eventInfo', ReflectionKind.TypeReferenceTarget, eventReflection );
		eventInfoParameter.type = eventInfoClassReference;

		eventInfoParameter.comment = new Comment( [
			{
				kind: 'text',
				text: 'An object containing information about the fired event.'
			}
		] );

		// The first parameter for each event is always the `eventInfo`.
		eventReflection.parameters = eventReflection.parameters || [];
		eventReflection.parameters.unshift( eventInfoParameter );
	}
}
