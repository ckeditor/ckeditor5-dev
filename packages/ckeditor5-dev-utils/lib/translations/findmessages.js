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

	walk.simple( ast, {
		CallExpression: node => {
			// Log a warning for the `editor.t()` calls and similar which aren't supported yet.
			if ( isTMethodCallExpression( node ) ) {
				const objName = node.callee.object.name;
				const propName = node.callee.property.name;

				onErrorFound(
					// TODO - ${ objName }.${ propName } is naive.
					`Found '${ objName }.${ propName }()' in the ${ sourceFile }. ` +
					'Only messages from direct \'t()\' calls will be handled by CKEditor 5 translation mechanisms.'
				);
			}

			if ( !isTFunctionCallExpression( node ) ) {
				return;
			}

			const firstArgument = node.arguments[ 0 ];

			if ( firstArgument.type === 'ObjectExpression' ) {
				const properties = firstArgument.properties || [];

				const contextProperty = properties.find( p => p.key.type === 'Identifier' && p.key.name === 'context' );
				const stringProperty = properties.find( p => p.key.type === 'Identifier' && p.key.name === 'string' );
				const pluralProperty = properties.find( p => p.key.type === 'Identifier' && p.key.name === 'plural' );

				// TODO - value assertions.

				/** @type {Message} */
				const message = {
					string: stringProperty.value.value,
					id: stringProperty.value.value
				};

				if ( contextProperty ) {
					message.context = contextProperty.value.value;
					message.id = stringProperty.value.value + '_' + contextProperty.value.value;
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
				`First t() call argument should be a string literal or an object literal (${ sourceFile }).`
			);
		}
	} );
};

function isTFunctionCallExpression( node ) {
	return node.callee.name === 't';
}

function isTMethodCallExpression( node ) {
	return (
		node.callee.type === 'MemberExpression' &&
		node.callee.property.name === 't' &&

		// Skip this.t() calls.
		// These calls can be used frequently in the minified/ obfuscated code.
		node.callee.object.type !== 'ThisExpression'
	);
}

/**
 * @typedef {Object} Message
 *
 * @property {String} id
 * @property {String} string
 * @property {String} [context]
 * @property {String} [plural]
 */
