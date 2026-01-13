/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	type Application,
	type Context,
	type Reflection
} from 'typedoc';
import { getPluginPriority } from '../utils/getpluginpriority.js';

/**
 * The `typedoc-plugin-symbol-fixer` plugin renames `Symbol.*` definitions with the JSDoc style.
 *
 *   * Typedoc: `[iterator]() → Iterator`
 *   * JSDoc: `Symbol.iterator() → Iterator`
 */
export function typeDocSymbolFixer( app: Application ): void {
	app.converter.on( Converter.EVENT_CREATE_DECLARATION, onEventCreateDeclaration(), getPluginPriority( typeDocSymbolFixer.name ) );
}

function onEventCreateDeclaration(): ( ( context: Context, reflection: Reflection ) => void ) {
	return ( context, reflection ) => {
		if ( !isWrappedInSquareBrackets( reflection.name ) ) {
			return;
		}

		const symbolName = reflection.name.slice( 1, -1 );

		if ( symbolName in Symbol ) {
			reflection.name = `Symbol.${ symbolName }`;
		} else {
			const symbol = context.getSymbolFromReflection( reflection )!;
			const node = symbol.declarations!.at( 0 )!;

			context.logger.warn( 'Non-symbol wrapped in square brackets', node );
		}
	};
}

function isWrappedInSquareBrackets( value: string ): boolean {
	return value.startsWith( '[' ) && value.endsWith( ']' );
}

