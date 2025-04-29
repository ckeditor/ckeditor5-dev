/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReflectionKind,
	DeclarationReflection,
	type ReferenceReflection,
	type Context,
	type Application
} from 'typedoc';

/**
 * The `typedoc-plugin-reference-fixer` tries to fix a case when TypeDoc incorrectly assigns reflections that are re-exported from another
 * file as a default export. In such case TypeDoc adds reflection declaration to the file containing the re-export and the actual source
 * file contains only a reference targeting the declaration from the re-exported file.
 *
 * This plugin works as follows:
 * - It searches for reflection declarations defined in "index" modules. Then, all such reflections are moved to the correct place where
 *   they are defined in the source code. References are moved to "index" modules where they are re-exported.
 * - The exception is the `ckeditor5-icons` package, which contains only references in "index" module. For this case, reflection
 *   declarations which represent icons are created manually.
 */
export default function( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd );
}

function onEventEnd( context: Context ) {
	const reflections = context.project.getReflectionsByKind( ReflectionKind.Reference ) as Array<ReferenceReflection>;

	for ( const reflection of reflections ) {
		// Skip processing references collected from TypeScript typings files ("*.d.ts").
		if ( isTypingsSource( reflection ) ) {
			continue;
		}

		const reflectionParent = reflection.parent as DeclarationReflection;
		const targetReflection = reflection.getTargetReflectionDeep() as DeclarationReflection;
		const targetReflectionParent = targetReflection.parent as DeclarationReflection;

		// The `ckeditor5-icons` package re-exports SVGs in `icons/index` module, so it needs a dedicated handler.
		if ( reflectionParent.name === 'icons/index' ) {
			const newReflectionName = new DeclarationReflection( reflection.name, ReflectionKind.Variable, reflectionParent );
			newReflectionName.sources = [ ...reflection.sources! ];
			newReflectionName.flags = targetReflection.flags;
			newReflectionName.type = targetReflection.type;

			reflectionParent.addChild( newReflectionName );
			reflectionParent.removeChild( reflection );

			continue;
		}

		// If the reflection is declared as a child of the "index" module, move it to the proper (target) location.
		if ( isIndexModule( targetReflectionParent ) ) {
			targetReflection.name = targetReflection.escapedName || targetReflection.name;

			targetReflection.parent = reflectionParent;
			reflectionParent.addChild( targetReflection );
			targetReflectionParent.removeChild( targetReflection );

			reflection.parent = targetReflectionParent;
			reflectionParent.removeChild( reflection );
			targetReflectionParent.addChild( reflection );
		}
	}
}

function isTypingsSource( reflection: DeclarationReflection ) {
	const [ source ] = reflection.sources!;

	return source?.fullFileName.endsWith( '.d.ts' );
}

function isIndexModule( reflection: DeclarationReflection ) {
	const [ source ] = reflection.sources!;

	const isIndexFile = source!.fullFileName.endsWith( '/index.ts' );
	const isModule = reflection.kind === ReflectionKind.Module;

	return isIndexFile && isModule;
}
