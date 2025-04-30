/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReflectionKind,
	ReferenceReflection,
	type Context,
	type Application,
	type DeclarationReflection
} from 'typedoc';
import './augmentation.js';
import { getPluginPriority } from '../utils/getpluginpriority.js';

/**
 * The `typedoc-plugin-interface-augmentation-fixer` tries to fix an interface, that has been extended (augmented) from the outside (from
 * another module) in the re-exported "index.ts" file. When the extending "declare module ..." declaration contains the full package name,
 * it points to the "index.ts" file instead of the actual source file. In such case Typedoc adds new properties to the interface, but not
 * in place where it has been defined, but in the "index.ts" file, where it is re-exported. Then, the generated output contains duplicated
 * interface definitions, with only one containing all properties.
 *
 * This plugin works as follows:
 * - Copies the externally added properties to the source definition.
 * - Replaces the duplicated interface with a reference to the source definition.
 */
export function typeDocInterfaceAugmentationFixer( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd, getPluginPriority( typeDocInterfaceAugmentationFixer.name ) );
}

function onEventEnd( context: Context ) {
	const reflections = context.project.getReflectionsByKind( ReflectionKind.Interface ) as Array<DeclarationReflection>;

	for ( const reflection of reflections ) {
		// A name of the main module exported by a package.
		const moduleName = reflection.parent!.name.split( '/' ).shift()!;

		// An interface reflection from which we want to copy children.
		// This reflection is located at the module's root level in the re-exported "index.ts" file.
		const interfaceToCopy = context.project.getChildByName( [ moduleName, reflection.name ] ) as DeclarationReflection;

		// A reflection does not exist.
		if ( !interfaceToCopy ) {
			continue;
		}

		// An interface does not contain children. Hence, there is nothing to copy.
		if ( !interfaceToCopy.children ) {
			continue;
		}

		// Extending a reflection in the actual source file, not in the re-exported "index.ts".
		// New properties were added correctly, so nothing needs to be fixed.
		if ( reflection.id === interfaceToCopy.id ) {
			continue;
		}

		// Copy properties from an extended interface exported via the main package `index.ts` (module augmentation).
		reflection.children = interfaceToCopy.children.slice();

		// We do not want to have the same interface defined twice.
		// The goal is to have a reference as a child in the main module.
		// `ReferenceReflection#constructor()` is an internal API. We should find a proper way to create such objects.
		const newRef = new ReferenceReflection( interfaceToCopy.name, reflection, interfaceToCopy.parent );

		newRef.sources = [ ...interfaceToCopy.sources || [] ];

		// Re-use the identifier from the extended interface.
		newRef.id = interfaceToCopy.id;

		context.withScope( newRef.parent! ).addChild( newRef );

		// Temporarily store the unique symbol from the extended interface...
		const oldSymbol = context.project.getSymbolIdFromReflection( interfaceToCopy );

		context.project.removeReflection( interfaceToCopy );

		// ...just to register the new reference reflection with this old symbol.
		// This trick is needed to make sure that all type references still point to the correct reflection.
		context.project.registerReflection( newRef, oldSymbol, undefined );

		// Store augmented interfaces, because it might be required to post-process them in another plugin,
		// i.e. in `typedoc-plugin-purge-private-api-docs` to remove reflection sources targeting private packages.
		context.project.ckeditor5AugmentedInterfaces ??= [];
		context.project.ckeditor5AugmentedInterfaces.push( reflection );
	}
}
