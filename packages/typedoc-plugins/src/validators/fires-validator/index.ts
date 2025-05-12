/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type Context, type DeclarationReflection, ReflectionKind } from 'typedoc';
import { getNode, isAbsoluteIdentifier, isIdentifierValid, isReflectionValid } from '../../utils/index.js';
import { type ValidatorErrorCallback } from '../index.js';

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if the event in the "@fires" tag exists.
 */
export default function( context: Context, onError: ValidatorErrorCallback ): void {
	const reflections = context.project
		.getReflectionsByKind( ReflectionKind.Class | ReflectionKind.CallSignature )
		.filter( isReflectionValid ) as Array<DeclarationReflection>;

	for ( const reflection of reflections ) {
		const identifiers = getIdentifiersFromFiresTag( reflection );

		if ( !identifiers.length ) {
			continue;
		}

		for ( const identifier of identifiers ) {
			const isValid = isIdentifierValid( context, reflection, identifier );

			if ( !isValid ) {
				const eventName = identifier.replace( /^#event:/, '' );

				onError( `Incorrect event name: "${ eventName }" in the @fires tag`, getNode( context, reflection ) );
			}
		}
	}
}

function getIdentifiersFromFiresTag( reflection: DeclarationReflection ) {
	if ( !reflection.comment ) {
		return [];
	}

	return reflection.comment.getTags( '@fires' )
		.flatMap( tag => tag.content.map( item => item.text.trim() ) )
		.map( identifier => {
			if ( isAbsoluteIdentifier( identifier ) ) {
				return identifier;
			}

			return '#event:' + identifier;
		} );
}
