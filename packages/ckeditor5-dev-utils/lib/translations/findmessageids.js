/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const acorn = require( 'acorn' );
const walk = require( 'acorn-walk' );

/**
 * Parses source and finds message ids from `t()` calls.
 *
 * @param {String} source JS source text which will be translated.
 * @param {Function} onMessageIdFound
 * @param {Function} onErrorFound
 * @returns {String} Transformed source.
 */
module.exports = function findMessageIds( source, sourceFile, onMessageIdFound, onErrorFound ) {
	const ast = acorn.parse( source, {
		sourceType: 'module',
		ranges: true,
		ecmaVersion: 10
	} );

	// TODO - support more methods.

	walk.simple( ast, {
		CallExpression: node => {
			if ( node.callee.name !== 't' ) {
				return;
			}

			const firstArgument = node.arguments[ 0 ]

			if ( firstArgument.type === 'ObjectExpression' ) {
				const properties = firstArgument.properties || [];

				const contextProperty = properties.find( p => p.key.type === 'Identifier' && p.key.name === 'context' );
				const stringProperty = properties.find( p => p.key.type === 'Identifier' && p.key.name === 'string' );

				// TODO - value assertions.
				// if ( contextProperty && stringProperty ) {
				// 	onMessageIdFound( stringProperty.value.value + '_' + contextProperty.value.value );
				// } else if ( stringProperty ) {
					onMessageIdFound( stringProperty.value.value );
				// }

				return;
			}

			if ( firstArgument.type === 'Literal' ) {
				onMessageIdFound( firstArgument.value );

				return;
			}

			onErrorFound( `First t() call argument should be a string literal or an object literal in ${ sourceFile }. Omitting.` );
		}
	} );
};
