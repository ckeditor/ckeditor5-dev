/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { ReflectionKind, type Reflection, type Context, type DeclarationReflection } from 'typedoc';
import { isAbsoluteIdentifier } from './isabsoluteidentifier.js';
import { toAbsoluteIdentifier } from './toabsoluteidentifier.js';

/**
 * Checks if the provided identifier targets an existing reflection within the whole project and returns found reflection.
 * If the target is not found, returns null.
 */
export function getTarget( context: Context, reflection: Reflection, identifier: string ): DeclarationReflection | null {
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

	if ( isIdentifierLabeledSignature ) {
		// If the identifier is a labeled signature, just use the method/function name and the labeled signature will be searched later.
		parts.push( lastPartName );
	} else {
		// Otherwise, restore the original identifier part.
		parts.push( lastPart );
	}
	const targetReflection = context.project.getChildByName( parts ) as DeclarationReflection | null;

	// If couldn't find a reflection, perhaps we should look for properties defined in the `type` doclet.
	if ( !targetReflection ) {
		// Strip the property name...
		const partsWithoutIdentifier = parts.slice( 0, -1 );
		// ...and try to find the type declaration.
		const typeReflection = reflection.project.getChildByName( partsWithoutIdentifier );

		if ( !typeReflection || typeReflection.kind !== ReflectionKind.TypeAlias ) {
			return null;
		}

		// If found, verify if the property is available as a children of the type.
		const [ identifierName ] = parts.slice( -1 );

		// TODO: Support.
		return typeReflection.type.declaration.children.find( childrenReflection => childrenReflection.name === identifierName );
	}

	// Now, when the target reflection is found, do some checks whether it matches the identifier.
	// (1) Check if the labeled signature targets an existing signature.
	if ( isIdentifierLabeledSignature ) {
		// TODO: Support.
		if ( !targetReflection.signatures ) {
			return null;
		}

		// TODO: Support.
		const targetSignature = targetReflection.signatures.find( signature => {
			if ( !signature.comment ) {
				return false;
			}

			const labelTag = signature.comment.getTag( '@label' );

			if ( !labelTag ) {
				return false;
			}

			return labelTag.content[ 0 ].text === lastPartLabel;
		} );

		return targetSignature || null;
	}

	const isIdentifierStatic = absoluteIdentifier.includes( '.' );
	const isTargetReflectionStatic = Boolean( targetReflection.flags && targetReflection.flags.isStatic );

	// (2) Check if the static/non-static reflection flag matches the separator used in the identifier.
	if ( isIdentifierStatic !== isTargetReflectionStatic ) {
		return null;
	}

	return targetReflection;
}

