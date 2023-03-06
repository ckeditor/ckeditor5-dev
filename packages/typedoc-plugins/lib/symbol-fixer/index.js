/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter } = require( 'typedoc' );

/**
 * The `typedoc-plugin-symbol-fixer` plugin renames `Symbol.*` definitions with the JSDoc style.
 *
 *   * Typedoc: `[iterator]() → Iterator`
 *   * JSDoc: `Symbol.iterator() → Iterator`
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_CREATE_DECLARATION, onEventCreateDeclaration() );
	}
};

function onEventCreateDeclaration() {
	return ( context, reflection ) => {
		if ( !isWrappedInSquareBrackets( reflection.name ) ) {
			return;
		}

		const symbolName = reflection.name.slice( 1, -1 );

		if ( Symbol[ symbolName ] ) {
			reflection.name = `Symbol.${ symbolName }`;
		} else {
			const symbol = context.project.getSymbolFromReflection( reflection );
			const node = symbol.declarations[ 0 ];

			context.logger.warn( 'Non-symbol wrapped in square brackets', node );
		}
	};
}

/**
 * @param {String} value
 * @returns {Boolean}
 */
function isWrappedInSquareBrackets( value ) {
	return value.startsWith( '[' ) && value.endsWith( ']' );
}

