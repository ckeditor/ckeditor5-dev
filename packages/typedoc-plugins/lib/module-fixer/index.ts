/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReflectionKind,
	type Application,
	type Context,
	type Reflection,
	type TypeScript as ts
} from 'typedoc';

export default function( app: Application ): void {
	app.converter.on( Converter.EVENT_CREATE_DECLARATION, onEventCreateDeclaration() );
}

function onEventCreateDeclaration(): ( ( context: Context, reflection: Reflection ) => void ) {
	return ( context, reflection ) => {
		if ( reflection.kind !== ReflectionKind.Module ) {
			return;
		}

		const symbol = context.getSymbolFromReflection( reflection );

		// When processing an empty file.
		if ( !symbol ) {
			return;
		}

		const node = symbol.declarations!.at( 0 )!;

		// Not a module.
		if ( !( 'statements' in node ) ) {
			return;
		}

		const { statements } = node as { statements: Array<ts.Statement> };

		// Iterate over statements...
		for ( const statement of statements ) {
			if ( !( 'jsDoc' in statement ) ) {
				continue;
			}

			if ( !Array.isArray( statement.jsDoc ) ) {
				continue;
			}

			// ...to find a JSDoc block code...
			for ( const jsDoc of statement.jsDoc ) {
				const tags: Array<ts.JSDocTag> = jsDoc.tags || [];

				// ...that represents a module definition.
				const moduleTag = tags.find( tag => {
					return tag.tagName.text === 'module';
				} );

				if ( !moduleTag ) {
					continue;
				}

				// When found, use its value as a module name...
				reflection.name = moduleTag.comment as string;

				// ...and escape from the function. We achieved the goal.
				return;
			}
		}
	};
}
