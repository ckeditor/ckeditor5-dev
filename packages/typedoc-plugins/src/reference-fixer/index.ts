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
	DeclarationReflection
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

		// Icons need a separate handler.
		if ( reflection.parent!.name === 'icons/index' ) {
			const newReflectionName = new DeclarationReflection( reflection.name, ReflectionKind.Variable, reflection.parent );
			newReflectionName.sources = [ ...reflection.sources! ];
			newReflectionName.flags = targetReflection.flags;

			// TODO: Looks like it does not work as expected.
			// context.postReflectionCreation( newReflectionName, context.getSymbolFromReflection( reflection ), undefined );
			// context.finalizeDeclarationReflection( newReflectionName );

			( targetReflection.parent as DeclarationReflection ).addChild( newReflectionName );
			( targetReflection.parent as DeclarationReflection ).removeChild( reflection );
		} else {
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

				reflectionParent.removeChild( reflection );
				targetReflectionParent.addChild( reflection );
			}
		}
	}
}
