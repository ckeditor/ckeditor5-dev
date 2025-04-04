/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Reflection } from 'typedoc';

/**
 * Returns the TypeScript node from the reflection.
 */
export function getNode( reflection: Reflection ): ts.Node | null {
	let symbol = reflection.project.getSymbolFromReflection( reflection );
	let declarationIndex = 0;

	if ( !symbol ) {
		// The TypeDoc project does not store symbols for signatures. To get the TypeScript node from a signature, we need to get the
		// symbol from its parent, which contains all nodes for each signature.
		symbol = reflection.project.getSymbolFromReflection( reflection.parent );
		declarationIndex = reflection.parent.signatures ? reflection.parent.signatures.indexOf( reflection ) : 0;
	}

	// Not a ES6 module.
	if ( !symbol ) {
		return null;
	}

	return symbol.declarations[ declarationIndex ];
}
