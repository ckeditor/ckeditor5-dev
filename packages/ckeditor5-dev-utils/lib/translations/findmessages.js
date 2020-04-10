/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const acorn = require( 'acorn' );
const walk = require( 'acorn-walk' );

/**
 * Parses source and finds messages from the first argument of `t()` calls.
 *
 * @param {String} source A content of the JS file that will be translated.
 * @param {String} sourceFile A path to source file, used only for creating error messages.
 * @param {(msg: Message) => void} onMessageFound
 * @param {(err: string) => void} onErrorFound
 * @returns {String} Transformed source.
 */
module.exports = function findMessages( source, sourceFile, onMessageFound, onErrorFound ) {
	const ast = acorn.parse( source, {
		sourceType: 'module',
		ranges: true,
		ecmaVersion: 10
	} );

	// TODO - methods - add support or a warning.

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
				const pluralProperty = properties.find( p => p.key.type === 'Identifier' && p.key.name === 'plural' );

				// if ( contextProperty && stringProperty ) {
				// 	onMessageIdFound( stringProperty.value.value + '_' + contextProperty.value.value );
				// } else if ( stringProperty ) {

				// TODO - value assertions.

				/** @type {Message} */
				const message = {
					string: stringProperty.value.value,

					// TODO: stringProperty.value.value + '_' + contextProperty.value.value
					id: stringProperty.value.value
				};

				if ( contextProperty ) {
					message.context = contextProperty.value.value;
				}

				if ( pluralProperty ) {
					message.plural = pluralProperty.value.value;
				}

				onMessageFound( message );

				return;
			}

			if ( firstArgument.type === 'Literal' ) {
				onMessageFound( {
					string: firstArgument.value,
					id: firstArgument.value
				} );

				return;
			}

			onErrorFound(
				`First t() call argument should be a string literal or an object literal in ${ sourceFile }. See https://github.com/ckeditor/ckeditor5/issues/6526.`
			);
		}
	} );
};

/**
 * @typedef {Object} Message
 *
 * @property {String} id
 * @property {String} string
 * @property {String} [context]
 * @property {String} [plural]
 */
