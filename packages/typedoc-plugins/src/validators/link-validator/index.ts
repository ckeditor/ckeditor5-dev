/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type Context, type DeclarationReflection, ReflectionKind } from 'typedoc';
import { getNode, isIdentifierValid, isReflectionValid } from '../../utils/index.js';
import { type ValidatorErrorCallback } from '../index.js';

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if the identifier in the "@link" tag points to an existing doclet.
 */
export default function( context: Context, onError: ValidatorErrorCallback ): void {
	const reflections = context.project
		.getReflectionsByKind( ReflectionKind.All | ReflectionKind.Document )
		.filter( isReflectionValid ) as Array<DeclarationReflection>;

	for ( const reflection of reflections ) {
		const identifiers = getIdentifiersFromLinkTag( reflection );

		if ( !identifiers.length ) {
			continue;
		}

		for ( const identifier of identifiers ) {
			const isValid = isIdentifierValid( context, reflection, identifier );

			if ( !isValid ) {
				onError( `Incorrect link: "${ identifier }"`, getNode( context, reflection ) );
			}
		}
	}
}

function getIdentifiersFromLinkTag( reflection: DeclarationReflection ) {
	if ( !reflection.comment ) {
		return [];
	}

	// The "@link" tag can be located in the comment summary or it can be nested in other block tags.
	const parts = [
		...reflection.comment.summary,
		...reflection.comment.blockTags.flatMap( tag => tag.content )
	];

	return parts
		.filter( part => part.kind === 'inline-tag' && part.tag === '@link' )
		.map( part => {
			// The "@link" tag may contain the actual identifier and the display name after a space.
			// Split by space to extract only the identifier from the whole tag.
			const [ identifier ] = part.text.split( ' ' );

			return identifier;
		} );
}
