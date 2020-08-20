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
		messages: {
			'invalidMessageFormat': 'The error message has invalid format - it must follow kebab case.'
		},
		schema: []
	},
	create( context ) {
		return {
			ThrowStatement: node => {
				const throwExpression = node.argument;
				const errorName = throwExpression.callee.name;

				if ( errorName === 'CKEditorError' ) {
					const [ message ] = throwExpression.arguments;

					if ( !isValidFormat( message ) ) {
						// TODO: might include fixer
						context.report( {
							node: message,
							messageId: 'invalidMessageFormat'
						} );
					}
				}
			}
		};
	}
};

const VALID_MESSAGE_ID = /^[a-z-0-9]+$/;

function isValidFormat( messageNode ) {
	if ( messageNode.type !== 'Literal' ) {
		return false;
	}

	return VALID_MESSAGE_ID.test( messageNode.value );
}
