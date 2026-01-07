/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type Context, type DeclarationReflection, ReflectionKind } from 'typedoc';
import { getNode, isReflectionValid } from '../../utils/index.js';
import { type ValidatorErrorCallback } from '../index.js';

// The `@label` validator is currently not used.
// See: https://github.com/ckeditor/ckeditor5/issues/13591.

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if overloaded methods and functions are described with the mandatory "@label" tag.
 *
 * Also, it prevents using the same name twice for overloaded structures.
 */
export default function( context: Context, onError: ValidatorErrorCallback ): void {
	const kinds = ReflectionKind.Method | ReflectionKind.Constructor | ReflectionKind.Function;
	const reflections = context.project
		.getReflectionsByKind( kinds )
		.filter( isReflectionValid ) as Array<DeclarationReflection>;

	for ( const reflection of reflections ) {
		// Omit non-overloaded structures.
		if ( reflection.signatures!.length === 1 ) {
			continue;
		}

		const uniqueValues = new Set();

		const isInherited = !!reflection.inheritedFrom;
		const errorMessageSuffix = isInherited ? ' due the inherited structure' : '';

		for ( const signature of reflection.signatures! ) {
			const labelTag = signature.comment?.getTag( '@label' );
			const node = getNode( context, signature );

			// Check if a signature has a label...
			if ( labelTag ) {
				const comment = labelTag.content.at( 0 )!;

				// ...and whether it is a unique value.
				if ( uniqueValues.has( comment.text ) ) {
					onError( `Duplicated name: "${ comment.text }" in the @label tag` + errorMessageSuffix, node );
				} else {
					uniqueValues.add( comment.text );
				}
			} else {
				onError( 'Overloaded signature misses the @label tag' + errorMessageSuffix, node );
			}
		}
	}
}
