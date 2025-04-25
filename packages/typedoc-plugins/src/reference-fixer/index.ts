/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReflectionKind,
	type ReferenceReflection,
	type Context,
	type Application,
	type DeclarationReflection
} from 'typedoc';

/**
 * TODO: Add description.
 * TODO: Add tests.
 */
export default function( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd );
}

function onEventEnd( context: Context ) {
	const reflections = context.project.getReflectionsByKind( ReflectionKind.Reference ) as Array<ReferenceReflection>;

	for ( const reflection of reflections ) {
		const targetReflection = reflection.getTargetReflectionDeep() as DeclarationReflection;

		const shouldFix1 =
			reflection.parent!.name.split( '/' ).length >
			targetReflection.parent!.name.split( '/' ).length;

		const shouldFix2 = targetReflection.parent!.name.endsWith( '/index' );

		// TODO: Consider better conditions.
		if ( shouldFix1 || shouldFix2 ) {
			targetReflection.name = targetReflection.escapedName || targetReflection.name;

			const reflectionParent = reflection.parent as DeclarationReflection;
			const targetReflectionParent = targetReflection.parent as DeclarationReflection;

			reflectionParent.addChild( targetReflection );
			targetReflectionParent.removeChild( targetReflection );
		}
	}
}
