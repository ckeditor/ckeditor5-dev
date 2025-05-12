/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReflectionKind,
	type Context,
	type Application
} from 'typedoc';

/**
 * The `typedoc-plugin-remove-class-c` is for TESTING PURPOSES ONLY. It removes the class reflection if its name is "ClassC".
 * In tests, the "ClassC" is the derived class:
 *
 * ClassA
 *   ⤷ ClassB
 *      ⤷ ClassC
 *
 * This plugin was created to simulate dynamically removed reflections while generating the API documentation, similarly to the
 * "typedoc-plugin-purge-private-api-docs".
 */
export default function( app: Application ): void {
	// TODO: To resolve types.
	// @ts-expect-error TS2339
	// Property 'on' does not exist on type 'Converter'.
	app.converter.on( Converter.EVENT_END, onEventEnd );
}

function onEventEnd( context: Context ) {
	const classReflections = context.project.getReflectionsByKind( ReflectionKind.Class );

	for ( const classReflection of classReflections ) {
		if ( classReflection.name === 'ClassC' ) {
			context.project.removeReflection( classReflection );
		}
	}
}
