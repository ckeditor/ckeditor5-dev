/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, Comment, TypeParameterReflection } = require( 'typedoc' );
const ts = require( 'typescript' );

const ERROR_TAG_NAME = 'error';

/**
 * The `typedoc-plugin-tag-error` collects error definitions from the `@error` tag.
 *
 * TODO: We do not support collecting types of `@param`.
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_CREATE_DECLARATION, onEventCreateDeclaration() );
	}
};

function onEventCreateDeclaration() {
	return ( context, reflection ) => {
		// Run only when processing a module.
		if ( reflection.kind !== ReflectionKind.Module ) {
			return;
		}

		const symbol = context.project.getSymbolFromReflection( reflection );
		const node = symbol.declarations[ 0 ];
		const sourceFile = node.getSourceFile();

		// Find all `@error` occurrences.
		const nodes = findDescendant( sourceFile, node => {
			if ( node.kind !== ts.SyntaxKind.Identifier ) {
				return false;
			}

			if ( node.escapedText !== ERROR_TAG_NAME ) {
				return false;
			}

			if ( !node.parent.comment ) {
				return false;
			}

			return true;
		} );

		// Create error definitions from typedoc declarations.
		for ( const errorNode of nodes ) {
			const parentNode = errorNode.parent;
			const errorName = parentNode.comment;

			const errorDeclaration = context
				.withScope( reflection )
				.createDeclarationReflection(
					ReflectionKind.ObjectLiteral,
					undefined,
					undefined,
					errorName
				);

			errorDeclaration.comment = new Comment( getCommentDisplayPart( parentNode.parent.comment ) );
			errorDeclaration.originalName = 'ErrorDeclaration';
			errorDeclaration.kindString = 'Object literal';
			errorDeclaration.typeParameters = parentNode.parent.getChildren()
				.filter( childTag => {
					if ( !childTag.comment || !parentNode.parent.comment ) {
						return false;
					}

					// Do not process the `@error` tag again.
					if ( childTag === parentNode ) {
						return false;
					}

					return true;
				} )
				.map( childTag => {
					const typeParameter = new TypeParameterReflection( childTag.name.escapedText, undefined, undefined, errorDeclaration );

					typeParameter.type = context.converter.convertType( context.withScope( typeParameter ) );
					typeParameter.comment = new Comment( getCommentDisplayPart( childTag.comment ) );

					return typeParameter;
				} );
		}
	};
}

/**
 * @param {ts.Node} sourceFileOrNode
 * @param { ( node: ts.Node) : boolean} callback
 * @returns {Array.<ts.Node>}
 */
function findDescendant( sourceFileOrNode, callback ) {
	const output = [];

	for ( const node of sourceFileOrNode.getChildren() ) {
		if ( node.getChildCount() ) {
			output.push( ...findDescendant( node, callback ) );
		} else {
			if ( callback( node ) ) {
				output.push( node );
			}
		}
	}

	return output;
}

/**
 * Transforms a node or array of node to an array of objects that follow
 * @param {String|Object|null} commentChildrenOrValue
 * @returns {Array.<require('typedoc').CommentDisplayPart> }
 */
function getCommentDisplayPart( commentChildrenOrValue ) {
	if ( !commentChildrenOrValue ) {
		return [];
	}

	if ( typeof commentChildrenOrValue === 'string' ) {
		return [
			{
				kind: 'text',
				text: commentChildrenOrValue
			}
		];
	}

	return commentChildrenOrValue
		.map( item => {
			let { text } = item;

			// An inline tag inside a description.
			if ( item.kind === 324 ) {
				// A reference, e.g. "module:".
				if ( item.name ) {
					text = item.name.escapedText + text;
				}

				return {
					text,
					kind: 'inline-tag',
					tag: '@link'
				};
			}

			return {
				text,
				kind: 'text'
			};
		} )
		.filter( ( { text } ) => text.length );
}
