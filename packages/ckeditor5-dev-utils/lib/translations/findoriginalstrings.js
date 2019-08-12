/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const acorn = require( 'acorn' );
const walk = require( 'acorn-walk' );
const logger = require( '../logger' )();

module.exports = function findOriginalStrings( source ) {
	const ast = acorn.parse( source, {
		sourceType: 'module',
		ecmaVersion: 9
	} );

	const originalStrings = [];

	walk.simple( ast, {
		CallExpression: node => {
			if ( node.callee.name !== 't' ) {
				return;
			}

			if ( node.arguments[ 0 ].type !== 'Literal' ) {
				logger.error( 'First t() call argument should be a string literal.' );

				return;
			}

			originalStrings.push( node.arguments[ 0 ].value );
		}
	} );

	return originalStrings;
};
