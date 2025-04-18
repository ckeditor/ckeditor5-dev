/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Context, DeclarationReflection, SignatureReflection } from 'typedoc';
import { isAbsoluteIdentifier } from './isabsoluteidentifier.js';
import { toAbsoluteIdentifier } from './toabsoluteidentifier.js';

/**
 * Checks if the provided identifier targets an existing reflection within the whole project and returns found reflection.
 * If the target is not found, returns null.
 */
export function getTarget(
	context: Context,
	reflection: DeclarationReflection,
	identifier: string
): DeclarationReflection | SignatureReflection | null {
	if ( !identifier ) {
		return null;
	}

	const absoluteIdentifier = isAbsoluteIdentifier( identifier ) ?
		identifier :
		toAbsoluteIdentifier( reflection, identifier );

	const parts = absoluteIdentifier
		// Remove leading "module:" prefix from the doclet longname.
		.substring( 'module:'.length )
		// Then, split the rest of the longname into separate parts.
		.split( /#|~|\./ );

	// The last part of the longname may contain a colon, which can be either a part of the event name, or it indicates that the name
	// targets a labeled signature.
	const lastPart = parts.pop()!;
	const [ lastPartName, lastPartLabel ] = lastPart.split( ':' ) as [ string, string ];

	const isIdentifierEvent = lastPart.startsWith( 'event:' );
	const isIdentifierLabeledSignature = !isIdentifierEvent && lastPart.includes( ':' );

	let targetReflection: DeclarationReflection | undefined;

	if ( isIdentifierEvent ) {
		targetReflection = context.project.getChildByName( parts )?.ckeditor5Events.find( event => event.name === lastPartLabel );
	} else {
		parts.push(
			isIdentifierLabeledSignature ?
				// If the identifier is a labeled signature, use the method/function name.
				lastPartName :
				// Otherwise, restore the original identifier part.
				lastPart
		);

		targetReflection = context.project.getChildByName( parts ) as DeclarationReflection | undefined;
	}

	if ( !targetReflection ) {
		return null;
	}

	// Now, when the target reflection is found, do some checks whether it matches the identifier.
	// (1) Check if the labeled signature targets an existing signature.
	if ( isIdentifierLabeledSignature ) {
		if ( !targetReflection.signatures ) {
			return null;
		}

		const targetSignature = targetReflection.signatures.find( signature => {
			if ( !signature.comment ) {
				return false;
			}

			const labelTag = signature.comment.getTag( '@label' );

			if ( !labelTag ) {
				return false;
			}

			return labelTag.content[ 0 ]?.text === lastPartLabel;
		} );

		return targetSignature || null;
	}

	const isIdentifierStatic = absoluteIdentifier.includes( '.' );
	const isTargetReflectionStatic = targetReflection.flags.isStatic;

	// (2) Check if the static/non-static reflection flag matches the separator used in the identifier.
	if ( isIdentifierStatic !== isTargetReflectionStatic ) {
		return null;
	}

	return targetReflection;
}

