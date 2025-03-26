/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Comment,
	Converter,
	ReflectionKind,
	TypeScript as ts,
	type Reflection,
	ReflectionFlag,
	type Application,
	type Context,
	type CommentDisplayPart
} from 'typedoc';

declare module 'typedoc' {
	export enum ReflectionFlag {

		/**
		 * The reflection is an error.
		 */
		isError = 2048
	}
}

const ERROR_TAG_NAME = 'error';

/**
 * The `typedoc-plugin-tag-error` collects error definitions from the `@error` tag.
 *
 * So far, we do not support collecting types of `@param`.
 */
export default function ( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd );

	app.serializer.addSerializer( new CustomFlagSerializer() as any );
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
			if ( node.escapedText !== ERROR_TAG_NAME ) {
				return false;
			}

			// Remove error-like nodes, e.g. "@eventName error".
			if ( node.parent.tagName && node.parent.tagName.escapedText !== ERROR_TAG_NAME ) {
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
			const errorName = parentNode.comment;

			const errorDeclaration = context
				.withScope( reflection )
				.createDeclarationReflection(
					ReflectionKind.Document,
					undefined,
					undefined,
					errorName
				);
			errorDeclaration.setFlag( ReflectionFlag.isError, true );

			errorDeclaration.comment = new Comment( getCommentDisplayPart( parentNode.parent.comment ) );
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
			// 		typeParameter.comment = new Comment( getCommentDisplayPart( childTag.comment ) );
			//
			// 		return typeParameter;
			// 	} );
		}
	}
}

function findDescendant( sourceFileOrNode: ts.Node, callback: ( node: ts.Node ) => boolean ): Array<ts.Node> {
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
 */
function getCommentDisplayPart( commentChildrenOrValue: string | Array<CommentDisplayPart> | null ): Array<CommentDisplayPart> {
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
			if ( item.kind === ts.SyntaxKind.JSDocLink ) {
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

type PartialObject = {
	[ key: string ]: unknown;
	flags: {
		[ key: string ]: boolean;
	};
};

class CustomFlagSerializer {
	public get priority() {
		return 0;
	}

	public supports() {
		return true;
	}

	public toObject( item: Reflection, obj: PartialObject ): object {
		if ( !( 'flags' in item ) ) {
			return obj;
		}

		const { flags } = item;

		if ( flags.hasFlag( 20248 as ReflectionFlag ) ) {
			obj.flags.isError = true;
		}

		return obj;
	}
}
