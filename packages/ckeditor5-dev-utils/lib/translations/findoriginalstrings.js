/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const acorn = require( 'acorn' );
const walk = require( 'acorn/dist/walk' );

module.exports = function findOriginalStrings( source ) {
	const ast = acorn.parse( source, {
		sourceType: 'module',
	} );

	const originalStrings = [];

	walk.simple( ast, {
		CallExpression: ( node ) => {
			if ( node.callee.name !== 't' ) {
				return;
			}

			if ( node.arguments[ 0 ].type !== 'Literal' ) {
				console.error( 'First t() call argument should be a string literal.' );

				return;
			}

			originalStrings.push( node.arguments[ 0 ].value );
		}
	} );

	return originalStrings;
};
