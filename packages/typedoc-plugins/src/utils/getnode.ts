/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Context, DeclarationReflection, SignatureReflection, TypeScript } from 'typedoc';

/**
 * Returns the TypeScript node from the reflection.
 */
export function getNode( context: Context, reflection: DeclarationReflection | SignatureReflection ): TypeScript.Declaration | null {
	let symbol = null;
	let declarationIndex = 0;

	if ( reflection.isSignature() ) {
		// The TypeDoc project does not store symbols for signatures. To get the TypeScript node from a signature, we need to get the
		// symbol from its parent, which contains all nodes for each signature.
		symbol = context.getSymbolFromReflection( reflection.parent );

		declarationIndex = reflection.parent.signatures!.findIndex( signature => signature.id === reflection.id );
	} else {
		symbol = context.getSymbolFromReflection( reflection );
	}

	// Not a ES6 module.
	if ( !symbol ) {
		return null;
	}

	return symbol.declarations![ declarationIndex ] || null;
}
