/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	meta: {
		type: 'problem',

		docs: {
			description: 'Disallow relative imports from CKEditor5 packages.',
			category: 'CKEditor5'
		},
		schema: []
	},
	create( context ) {
		return {
			ThrowStatement: node => {
				const throwExpression = node.argument;
				const errorName = throwExpression.callee.name;

				if ( errorName === 'CKEditorError' ) {
					const [ message, contextArg ] = throwExpression.arguments;

					if ( !isValidMessage( message ) ) {
						context.report( {
							node: message,
							message: 'Invalid error message format'
						} );
					}
				}
			}
		};
	}
};

function isValidMessage( messageNode ) {
	if ( messageNode.type !== 'Literal' ) {
		return false;
	}

	if ( messageNode.value.includes( ':' ) ) {
		return false;
	}

	return true;
}
