/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind } = require( 'typedoc' );

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
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEventEnd );
	}
};

function onEventEnd( context ) {
	const classReflections = context.project.getReflectionsByKind( ReflectionKind.Class );

	for ( const classReflection of classReflections ) {
		if ( classReflection.name === 'ClassC' ) {
			context.project.removeReflection( classReflection );
		}
	}
}
