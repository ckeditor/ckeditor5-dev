/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Comment,
	Converter,
	ReflectionKind,
	TypeParameterReflection,
	TypeScript as ts,
	type Application,
	type Context,
	type CommentDisplayPart
} from 'typedoc';

import CustomFlagSerializer from './customflagserializer.js';
import './augmentation.js';

const ERROR_TAG_NAME = 'error';

/**
 * The `typedoc-plugin-tag-error` collects error definitions from the `@error` tag.
 *
 * So far, we do not support collecting types of `@param`.
 */
export default function ( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd );

	// TODO: To resolve types.
	// @ts-expect-error TS2345
	// Argument of type CustomFlagSerializer is not assignable to parameter of type SerializerComponent<Reflection>
	// The types returned by toObject(...) are incompatible between these types.
	app.serializer.addSerializer( new CustomFlagSerializer() );
}

function onEventEnd( context: Context ) {
	const moduleReflections = context.project.getReflectionsByKind( ReflectionKind.Module );

	// Errors are children of a module.
	for ( const reflection of moduleReflections ) {
		const symbol = context.getSymbolFromReflection( reflection );

		// Not ES6 module.
		if ( !symbol ) {
			continue;
		}

		const node = symbol.declarations!.at( 0 )!;
		const sourceFile = node.getSourceFile();

		// Find all `@error` occurrences.
		const nodes = findDescendant( sourceFile, node => {
			// Remove non-block comment codes.
			if ( node.kind !== ts.SyntaxKind.Identifier ) {
				return false;
			}

			// Filter out non "error" nodes.
			if ( node.text !== ERROR_TAG_NAME ) {
				return false;
			}

			// Remove error-like nodes, e.g. "@eventName error".
			if ( node.parent.tagName?.text !== ERROR_TAG_NAME ) {
				return false;
			}

			// Filter out empty definitions.
			if ( !node.parent.comment ) {
				return false;
			}

			return true;
		} );

		// Create error definitions from typedoc declarations.
		for ( const errorNode of nodes ) {
			const parentNode = errorNode.parent;
			const errorName = parentNode.comment!;

			const errorDeclaration = context
				.withScope( reflection )
				.createDeclarationReflection(
					ReflectionKind.Document,
					undefined,
					undefined,
					errorName
				);
			errorDeclaration.isCKEditor5Error = true;

			// if ( errorName === 'customerror-inside-method') {
			// 	const value = parentNode.parent.getChildren()
			// 		.filter( childTag => {
			// 			if ( !childTag.comment || !parentNode.parent.comment ) {
			// 				return false;
			// 			}
			//
			// 			// Do not process the `@error` tag again.
			// 			if ( childTag === parentNode ) {
			// 				return false;
			// 			}
			//
			// 			return true;
			// 		} )
			// 		.map( childTag => {
			// 			const typeParameter = new TypeParameterReflection( childTag.name.escapedText, undefined, undefined, errorDeclaration );
			//
			// 			// typeParameter.type = context.converter.convertType( context.withScope( typeParameter ) );
			// 			// typeParameter.comment = new Comment( createComment( childTag.comment ) );
			//
			// 			// return typeParameter;
			//
			// 			return {
			// 				type: context.converter.convertType( context.withScope( typeParameter ) ),
			// 				comment: new Comment( createComment( childTag.comment ) )
			// 			}
			// 		} );
			//
			// 	console.log( value );
			// }

			const { parent } = parentNode as unknown as { parent: { comment: MaybeCommentDisplayPart } };

			errorDeclaration.comment = createComment( parent.comment );
			// errorDeclaration.kindString = 'Error';
			// errorDeclaration.typeParameters = parentNode.parent.getChildren()
			// 	.filter( childTag => {
			// 		if ( !childTag.comment || !parentNode.parent.comment ) {
			// 			return false;
			// 		}
			//
			// 		// Do not process the `@error` tag again.
			// 		if ( childTag === parentNode ) {
			// 			return false;
			// 		}
			//
			// 		return true;
			// 	} )
			// 	.map( childTag => {
			// 		const typeParameter = new TypeParameterReflection( childTag.name.escapedText, undefined, undefined, errorDeclaration );
			//
			// 		typeParameter.type = context.converter.convertType( context.withScope( typeParameter ) );
			// 		typeParameter.comment = new Comment( createComment( childTag.comment ) );
			//
			// 		return typeParameter;
			// 	} );
		}
	}
}

type ErrorTagNode = ts.Node & {
	text: string;
	parent: ts.Node & {
		tagName: ts.JSDocTag & {
			text: string;
		};
		comment?: string;
	};
};

type MaybeCommentDisplayPart = null | string | Array<CommentDisplayPart>;

function findDescendant(
	sourceFileOrNode: ts.SourceFile | ErrorTagNode,
	callback: ( node: ErrorTagNode ) => boolean
): Array<ErrorTagNode> {
	const output = [];

	for ( const node of sourceFileOrNode.getChildren() ) {
		const nodeAsErrorTag = node as unknown as ErrorTagNode;

		if ( nodeAsErrorTag.getChildCount() ) {
			output.push( ...findDescendant( nodeAsErrorTag, callback ) );
		} else {
			if ( callback( nodeAsErrorTag ) ) {
				output.push( nodeAsErrorTag );
			}
		}
	}

	return output;
}

/**
 * Converts a comment node (or array of nodes) to a format expected by `Reflection#comment`.
 */
function createComment( commentChildrenOrValue: MaybeCommentDisplayPart ): Comment {
	if ( !commentChildrenOrValue ) {
		return new Comment( [] );
	}

	if ( typeof commentChildrenOrValue === 'string' ) {
		return new Comment( [
			{
				kind: 'text',
				text: commentChildrenOrValue
			}
		] );
	}

	const comments = commentChildrenOrValue
		.map( item => {
			// Types says it's a string, while a run-time check says it can be a number.
			const kind = item.kind as unknown;

			// An inline tag inside a description.
			if ( kind === ts.SyntaxKind.JSDocLink ) {
				let { text } = item;

				// A reference, e.g. "module:".
				if ( 'name' in item && item.name ) {
					const { name } = item as { name: { text: string } };

					text = name.text + text;
				}

				return {
					text,
					kind: 'inline-tag',
					tag: '@link'
				} as const;
			}

			return {
				text: item.text,
				kind: 'text'
			} as const;
		} )
		.filter( ( { text } ) => text.length );

	return new Comment( comments );
}
