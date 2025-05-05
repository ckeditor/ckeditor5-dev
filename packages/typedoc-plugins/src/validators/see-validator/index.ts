/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type Context, type DeclarationReflection, ReflectionKind } from 'typedoc';
import { getNode, isIdentifierValid, isReflectionValid } from '../../utils/index.js';
import { type ValidatorErrorCallback } from '../index.js';

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if the identifier in the "@see" tag points to an existing doclet.
 */
export default function( context: Context, onError: ValidatorErrorCallback ): void {
	const reflections = context.project
		.getReflectionsByKind( ReflectionKind.All | ReflectionKind.Document )
		.filter( isReflectionValid ) as Array<DeclarationReflection>;

	for ( const reflection of reflections ) {
		const identifiers = getIdentifiersFromSeeTag( reflection );

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

function getIdentifiersFromSeeTag( reflection: DeclarationReflection ) {
	if ( !reflection.comment ) {
		return [];
	}

	return reflection.comment.getTags( '@see' )
		.flatMap( tag => tag.content.map( item => item.text.trim() ) )
		.filter( text => {
			// Remove list markers (e.g. "-").
			if ( text.length <= 1 ) {
				return false;
			}

			// Remove external links.
			if ( /^https?:\/\//.test( text ) ) {
				return false;
			}

			return true;
		} );
}
