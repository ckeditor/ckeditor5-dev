/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeScript } = require( 'typedoc' );

module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_CREATE_DECLARATION, onEventCreateDeclaration() );
	}
};

function onEventCreateDeclaration() {
	return ( context, reflection ) => {
		if ( reflection.kind !== ReflectionKind.Module ) {
			return;
		}

		const symbol = context.getSymbolFromReflection( reflection );

		// When processing an empty file.
		if ( !symbol ) {
			return;
		}

		const node = symbol.declarations[ 0 ];

		// Not a module.
		if ( !node.statements ) {
			return;
		}

		// Iterate over statements...
		for ( const statement of node.statements ) {
			// TODO: No idea how to cover this line.
			// CKEditor 5 enters the if. However, the same code created as a fixture doesn't.
			if ( !Array.isArray( statement.jsDoc ) ) {
				continue;
			}

			// ...to find a JSDoc block code...
			for ( const jsDoc of statement.jsDoc ) {
				// ...that represents a module definition.
				const [ moduleTag ] = ( jsDoc.tags || [] ).filter( tag => {
					return tag.tagName.originalKeywordKind === TypeScript.SyntaxKind.ModuleKeyword;
				} );

				if ( !moduleTag ) {
					continue;
				}

				// When found, use its value as a module name.
				reflection.originalName = reflection.name;
				reflection.name = moduleTag.comment;

				// Escape from the function. We achieved the goal.
				return;
			}
		}
	};
}
