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
			'invalidMessageFormat': 'The error message has invalid format - it must follow kebab case.',
			'missingErrorAnnotation': 'The error "{{ messageId }}" has no matching @error JSDoc definition.'
		},
		schema: []
	},
	create( context ) {
		return {
			ThrowStatement: node => {
				const newExpression = node.argument;
				const errorName = newExpression.callee.name;

				if ( errorName === 'CKEditorError' ) {
					const [ message ] = newExpression.arguments;

					if ( !isValidFormat( message ) ) {
						// TODO: might include fixer
						context.report( {
							node: message,
							messageId: 'invalidMessageFormat'
						} );

						return;
					}

					// At this point CKEditorError has properly formatted errorId.
					const errorId = message.value;

					if ( !hasMatchingAnnotation( context.getSourceCode(), errorId ) ) {
						context.report( {
							node: message,
							messageId: 'missingErrorAnnotation',
							data: {
								messageId: errorId
							}
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

const isCommentBlockWithError = comment => comment.type === 'Block' && comment.value.includes( '@error' );

function hasMatchingAnnotation( sourceCode, messageId ) {
	const isErrorWithMessageId = getMessageIdValidator( messageId );

	const matchingComment = sourceCode.getAllComments()
		.filter( isCommentBlockWithError )
		.find( comment => !!comment.value.split( '\n' ).find( isErrorWithMessageId ) );

	return !!matchingComment;
}

function getMessageIdValidator( messageId ) {
	const pattern = `@error ${ messageId }$`;
	const isValidRe = new RegExp( pattern );

	return string => isValidRe.test( string );
}
