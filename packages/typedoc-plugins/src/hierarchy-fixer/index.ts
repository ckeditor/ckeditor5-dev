/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReferenceType,
	ReflectionKind,
	type Application,
	type Context,
	type DeclarationReflection,
	type SomeType
} from 'typedoc';
import { getPluginPriority } from '../utils/getpluginpriority.js';

/**
 * The `typedoc-plugin-hierarchy-fixer` restores the class hierarchy broken by the mixin pattern:
 *
 * ```ts
 * const ClassicEditorBase: ElementApiMixinConstructor<typeof Editor> = ElementApiMixin( Editor );
 *
 * export class ClassicEditor extends ClassicEditorBase {}
 * ```
 *
 * The intermediate `*Base` constant is not exported, so TypeDoc does not document it. As a result, the class extends a reflection
 * that does not exist in the project, and the actual base class does not list the class in its `extendedBy` collection. Rendered
 * API pages lose the "Subclasses" entries and the hierarchy path between both classes.
 *
 * This plugin works as follows:
 * - It searches for classes whose parent (an entry in `extendedTypes`) is a reference that cannot be resolved within the project.
 * - Using the type checker, it reads the base types of such a class. For the mixin pattern, it is an intersection of the actual
 *   base class and the interfaces implemented by mixins, e.g. `Editor & ElementApi`.
 * - Base classes documented in the project replace the broken reference. The base class `extendedBy` collection is updated too,
 *   so the processed class appears in its "Subclasses" section.
 * - Interfaces documented in the project are added to `implementedTypes` of the processed class (and their `implementedBy`
 *   collections are updated). It covers mixins that do not extend any class, e.g. `class Editor extends ObservableMixin()`.
 * - When no part of the base type is documented in the project (e.g. a class extending the native `Error`), the reflection
 *   is left as is.
 *
 * Additionally, once the `typedoc-plugin-purge-private-api-docs` plugin removes reflections collected from private packages,
 * the `extendedBy` and `implementedBy` collections are filtered out of references pointing to the removed reflections. Otherwise,
 * names of the private API classes would leak into the "Subclasses" sections of the public API pages.
 *
 * The plugin must run after the `typedoc-plugin-event-inheritance-fixer` plugin. Inheriting events resolves the original (broken)
 * references to the mixin base classes, which are replaced by this plugin.
 */
export function typeDocHierarchyFixer( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd, getPluginPriority( typeDocHierarchyFixer.name ) );
	app.converter.on( Converter.EVENT_END, onEventEndCleanUp, getPluginPriority( 'typeDocHierarchyFixerCleanUp' ) );
}

function onEventEnd( context: Context ) {
	const reflections = context.project.getReflectionsByKind( ReflectionKind.Class ) as Array<DeclarationReflection>;

	for ( const reflection of reflections ) {
		if ( !reflection.extendedTypes || !reflection.extendedTypes.some( isBrokenReference ) ) {
			continue;
		}

		const { baseClasses, baseInterfaces } = getDocumentedBaseReflections( context, reflection );

		// The entire base type is not documented in the project. Nothing to fix.
		if ( !baseClasses.length && !baseInterfaces.length ) {
			continue;
		}

		const fixedTypes = reflection.extendedTypes.flatMap( type => {
			if ( !isBrokenReference( type ) ) {
				return [ type ];
			}

			return baseClasses.map( baseClass => {
				return ReferenceType.createResolvedReference( baseClass.name, baseClass, context.project );
			} );
		} );

		// A mixin does not have to extend any class, e.g. `class Editor extends ObservableMixin()`. In such a case the broken
		// reference is removed without a replacement, and the class becomes a root of its own hierarchy.
		reflection.extendedTypes = fixedTypes.length ? fixedTypes : undefined;

		for ( const baseClass of baseClasses ) {
			addBackReference( context, baseClass, 'extendedBy', reflection );
		}

		for ( const baseInterface of baseInterfaces ) {
			if ( !( reflection.implementedTypes || [] ).some( type => isReferenceTo( type, baseInterface ) ) ) {
				reflection.implementedTypes = [
					...reflection.implementedTypes || [],
					ReferenceType.createResolvedReference( baseInterface.name, baseInterface, context.project )
				];
			}

			addBackReference( context, baseInterface, 'implementedBy', reflection );
		}
	}
}

/**
 * Removes references to reflections that no longer exist in the project from the `extendedBy` and `implementedBy` collections.
 * References resolved by a symbol (pointing to types outside of the project) are kept.
 */
function onEventEndCleanUp( context: Context ) {
	const reflections = context.project.getReflectionsByKind(
		ReflectionKind.Class | ReflectionKind.Interface
	) as Array<DeclarationReflection>;

	for ( const reflection of reflections ) {
		for ( const collection of [ 'extendedBy', 'implementedBy' ] as const ) {
			if ( !reflection[ collection ] ) {
				continue;
			}

			const filteredTypes = reflection[ collection ].filter( type => type.reflection || type.symbolId );

			reflection[ collection ] = filteredTypes.length ? filteredTypes : undefined;
		}
	}
}

/**
 * Collects reflections representing the base type of the given class, as seen by the type checker. For the mixin pattern,
 * the base type is an intersection, e.g. `Editor & ElementApi`. Its members are resolved independently and grouped by their kind.
 * Members that are not documented in the project (e.g. native types) are ignored.
 */
function getDocumentedBaseReflections( context: Context, reflection: DeclarationReflection ) {
	const baseClasses: Array<DeclarationReflection> = [];
	const baseInterfaces: Array<DeclarationReflection> = [];
	const symbol = context.getSymbolFromReflection( reflection );

	if ( symbol ) {
		const instanceType = context.checker.getDeclaredTypeOfSymbol( symbol );
		const baseTypes = instanceType.isClassOrInterface() ? context.checker.getBaseTypes( instanceType ) : [];

		for ( const baseType of baseTypes ) {
			const baseTypeParts = baseType.isIntersection() ? baseType.types : [ baseType ];

			for ( const baseTypePart of baseTypeParts ) {
				const partSymbol = baseTypePart.getSymbol();
				const target = partSymbol ?
					context.getReflectionFromSymbol( partSymbol ) as DeclarationReflection | undefined :
					undefined;

				if ( !target || target === reflection ) {
					continue;
				}

				if ( target.kindOf( ReflectionKind.Class ) && !baseClasses.includes( target ) ) {
					baseClasses.push( target );
				} else if ( target.kindOf( ReflectionKind.Interface ) && !baseInterfaces.includes( target ) ) {
					baseInterfaces.push( target );
				}
			}
		}
	}

	return { baseClasses, baseInterfaces };
}

/**
 * Adds the given class to the `extendedBy` or `implementedBy` collection of its base reflection, unless it is already there.
 */
function addBackReference(
	context: Context,
	target: DeclarationReflection,
	collection: 'extendedBy' | 'implementedBy',
	reflection: DeclarationReflection
) {
	if ( !( target[ collection ] || [] ).some( type => isReferenceTo( type, reflection ) ) ) {
		target[ collection ] = [
			...target[ collection ] || [],
			ReferenceType.createResolvedReference( reflection.name, reflection, context.project )
		];
	}
}

/**
 * Checks whether the given type is a reference that cannot be resolved within the project. TypeDoc creates such references
 * when a class extends a symbol excluded from the documentation, e.g. a non-exported constant produced by a mixin.
 */
function isBrokenReference( type: SomeType ): boolean {
	return type instanceof ReferenceType && !type.reflection;
}

/**
 * Checks whether the given type is a reference resolved to the given reflection.
 */
function isReferenceTo( type: SomeType, reflection: DeclarationReflection ): boolean {
	return type instanceof ReferenceType && type.reflection === reflection;
}
