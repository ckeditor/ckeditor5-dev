/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const acorn = require( 'acorn' );
const walk = require( 'acorn/dist/walk' );
const escodegen = require( 'escodegen' );
const logger = require( '../logger' )();

/**
 * Parses source, translates `t()` call arguments and returns modified output.
 *
 * @param {String} source JS source text which will be translated.
 * @param {Function} translateString Function that will translate matched string to the destination language or hash.
 * @returns {String} Transformed source.
 */
module.exports = function translateSource( source, translateString ) {
	const comments = [];
	const tokens = [];

	const ast = acorn.parse( source, {
		sourceType: 'module',
		ranges: true,
		onComment: comments,
		onToken: tokens
	} );

	let changesInCode = false;

	walk.simple( ast, {
		CallExpression: node => {
			if ( node.callee.name !== 't' ) {
				return;
			}

			if ( node.arguments[ 0 ].type !== 'Literal' ) {
				logger.error( 'First t() call argument should be a string literal.' );

				return;
			}

			changesInCode = true;
			node.arguments[ 0 ].value = translateString( node.arguments[ 0 ].value );
		}
	} );

	// Optimization for files without t() calls.
	if ( !changesInCode ) {
		return source;
	}

	escodegen.attachComments( ast, comments, tokens );
	const output = escodegen.generate( ast, {
		comment: true
	} );

	return output;
};
