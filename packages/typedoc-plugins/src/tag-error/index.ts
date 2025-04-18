/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Comment,
	Converter,
	ReflectionKind,
	ParameterReflection,
	IntrinsicType,
	ReferenceType,
	TypeScript as ts,
	type Application,
	type Context,
	type CommentDisplayPart,
	type SomeType,
	type UnknownType
} from 'typedoc';

import ErrorTagSerializer from './errortagserializer.js';
import './augmentation.js';

const ERROR_TAG_NAME = 'error';

/**
 * The `typedoc-plugin-tag-error` collects error definitions from the `@error` tag.
 *
 * So far, we do not support collecting types of `@param`.
 */
export default function( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd );

	// TODO: To resolve types.
	// @ts-expect-error TS2345
	// Argument of type CustomFlagSerializer is not assignable to parameter of type SerializerComponent<Reflection>
	// The types returned by toObject(...) are incompatible between these types.
	app.serializer.addSerializer( new ErrorTagSerializer() );
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
			const { parent } = parentNode as unknown as { parent: { comment: MaybeCommentDisplayPart } };

			const errorDeclaration = context
				.withScope( reflection )
				.createDeclarationReflection(
					ReflectionKind.Document,
					undefined,
					undefined,
					errorName
				);

			errorDeclaration.isCKEditor5Error = true;
			errorDeclaration.comment = createComment( parent.comment );
			errorDeclaration.parameters = parentNode.parent.getChildren()
				.filter( _childTag => {
					const childTagAsParam = _childTag as unknown as ParamExpressionNode;

					if ( !childTagAsParam.comment || !parent.comment ) {
						return false;
					}

					// Do not process the `@error` tag again.
					// @ts-expect-error TS2367
					// While the types are show that there is no overlap, in run-time it occurs.
					// Hence, let's mute a compilator here.
					if ( childTagAsParam === parentNode ) {
						return false;
					}

					return true;
				} )
				.map( _childTag => {
					const childTagAsParam = _childTag as unknown as ParamExpressionNode;

					const parameter = new ParameterReflection( childTagAsParam.name.text, ReflectionKind.Parameter, errorDeclaration );
					parameter.comment = createComment( childTagAsParam.comment );

					try {
						parameter.type = convertType( context, childTagAsParam );
					} catch ( err ) {
						parameter.type = new IntrinsicType( 'any' );
					}

					return parameter;
				} );
		}
	}
}

function convertType( context: Context, childTag: ParamExpressionNode ): SomeType {
	const convertedType = context.converter.convertType( context, childTag.typeExpression );

	if ( !isUnknownType( convertedType ) ) {
		return convertedType;
	}

	const { name } = convertedType;

	// A dot notation is not supported (`@param {obj.field} ...`).
	if ( name.startsWith( '@param' ) ) {
		throw new Error( 'Conversion a type failed.' );
	}

	// TODO: Should we support local links, e.g., `~ChildrenClass`?
	const [ moduleName, childName ] = name.replace( 'module:', '' ).split( '~' );
	const childReflection = context.project.getChildByName( [ moduleName!, childName! ] );

	if ( !childReflection ) {
		throw new Error( 'A module reflection cannot be found.' );
	}

	return ReferenceType.createResolvedReference(
		childTag.name.text,
		childReflection,
		context.project
	);
}

function isUnknownType( type: SomeType ): type is UnknownType {
	return type.type === 'unknown';
}

type ParamExpressionNode = ts.Node & {
	name: {
		text: string;
	};
	comment: MaybeCommentDisplayPart;
	typeExpression: ts.TypeNode;
};

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
