/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, DeclarationReflection, Comment, CommentTag, TypeParameterReflection } = require( 'typedoc' );
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
	const processedModules = new Set();

	return ( context, reflection ) => {
		// Run only when processing a module.
		if ( reflection.kind !== ReflectionKind.Module ) {
			return;
		}

		const symbol = context.project.getSymbolFromReflection( reflection );
		const node = symbol.declarations[ 0 ];
		const sourceFile = node.getSourceFile();

		// As we iterate over all its nodes, it is enough to process the same file only once.
		if ( processedModules.has( sourceFile.resolvedPath ) ) {
			return;
		}

		processedModules.add( sourceFile.resolvedPath );

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

		// Map all definitions to typedoc declarations.
		const errorDeclarations = nodes.map( errorNode => {
			const parentNode = errorNode.parent;
			const errorName = parentNode.comment;

			const errorDeclaration = new DeclarationReflection( errorName, ReflectionKind.ObjectLiteral, reflection );
			const comment = new Comment( getCommentDisplayPart( parentNode.parent.comment ) );

			errorDeclaration.typeParameters = [];

			for ( const childTag of parentNode.parent.getChildren() ) {
				// No comments to process.
				if ( !childTag.comment ) {
					continue;
				}

				// Do not process the error description.
				if ( parentNode.parent === childTag || parentNode.parent.comment.includes( childTag ) ) {
					// TODO: Perhaps first if is not needed.
					continue;
				}

				// Do not process the `@error` tag again.
				if ( childTag === parentNode ) {
					continue;
				}

				const commentTag = getCommentDisplayPart( childTag.comment );

				comment.blockTags.push(
					new CommentTag( `@${ childTag.tagName.escapedText }`, commentTag )
				);

				const paramName = childTag.name.escapedText;

				// The assumptions here is that a parameter has a single type.
				// let type = '*';
				//
				// if ( childTag.typeExpression && childTag.typeExpression.type.typeName ) {
				// 	type = childTag.typeExpression.type.typeName.escapedText;
				// }

				const param = new TypeParameterReflection( paramName, undefined, undefined, errorDeclaration, undefined );

				// TODO: This line below throws. Perhaps using TypeScript would help.
				// param.type = new ParameterReflection( type, ReflectionKind.TypeLiteral, param );

				errorDeclaration.typeParameters.push( param );
			}

			errorDeclaration.comment = comment;
			errorDeclaration.originalName = 'EventDeclaration';
			errorDeclaration.kindString = 'Object literal';

			return errorDeclaration;
		} );

		for ( const declaration of errorDeclarations ) {
			context.addChild( declaration );
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
 * @returns {null|Array.<require('typedoc').CommentDisplayPart> }
 */
function getCommentDisplayPart( commentChildrenOrValue ) {
	if ( !commentChildrenOrValue ) {
		return null;
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
