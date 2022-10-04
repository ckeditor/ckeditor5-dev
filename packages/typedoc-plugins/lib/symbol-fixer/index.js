/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { Converter } = require( 'typedoc' );

/**
 * The `typedoc-plugin-symbol-fixer` aligns "Symbol.*" definitions with JSDoc style.
 *
 * Typedoc: [iterator]() → Iterator
 * JSDoc:   Symbol.iterator() → Iterator
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_CREATE_DECLARATION, onEventCreateDeclaration() );
	}
};

function onEventCreateDeclaration() {
	return ( context, reflection ) => {
		const patternMatch = reflection.name.match( /(?<=^\[).+(?=\]$)/ );

		if ( !patternMatch ) {
			return;
		}

		const type = patternMatch[ 0 ];
		const isValidSymbol = Symbol[ type ];

		if ( !isValidSymbol ) {
			console.log( chalk.yellow( `Non-symbol wrapped in square brackets: ${ chalk.bold( reflection.name ) }` ) );
			console.log( chalk.yellow( `Source: ${ chalk.underline( reflection.sources[ 0 ].fullFileName ) }` ) );

			return;
		}

		reflection.name = `Symbol.${ type }`;
		// Should these values also be updated?
		// reflection.originalName
		// reflection.escapedName
	};
}

