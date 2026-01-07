/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	type Application,
	Comment,
	type CommentDisplayPart,
	type Context,
	Converter,
	DeclarationReflection,
	IntrinsicType,
	ParameterReflection,
	ReferenceType,
	ArrayType,
	ReflectionKind,
	TypeScript as ts
} from 'typedoc';

import ErrorTagSerializer from './errortagserializer.js';
import { getTarget } from '../utils/index.js';
import { getPluginPriority } from '../utils/getpluginpriority.js';
import './augmentation.js';

const ERROR_PARAM_REGEXP = /@param\s+\{([^}]+)\}\s+([\w.]+)\s+(.+)/;
const ARRAY_TYPE_REGEXP = /<([^>]+)>/;
const ERROR_TAG_NAME = 'error';

/**
 * The `typedoc-plugin-tag-error` collects error definitions from the `@error` tag.
 */
export function typeDocTagError( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd, getPluginPriority( typeDocTagError.name ) );

	// TODO: To resolve types.
	// @ts-expect-error TS2345
	// Argument of type CustomFlagSerializer is not assignable to parameter of type SerializerComponent<Reflection>
	// The types returned by toObject(...) are incompatible between these types.
	app.serializer.addSerializer( new ErrorTagSerializer() );
}

function onEventEnd( context: Context ) {
	const moduleReflections = context.project.getReflectionsByKind( ReflectionKind.Module ) as Array<DeclarationReflection>;

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

			const errorDeclaration = new DeclarationReflection( errorName, ReflectionKind.Document, reflection );

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

					// Keep the `@param` tags only.
					if ( childTagAsParam.tagName.text !== 'param' ) {
						return false;
					}

					return true;
				} )
				.map( childTag => {
					return createParameter(
						context,
						errorDeclaration,
						childTag as unknown as ParamExpressionNode,
						errorDeclaration
					);
				} );

			context
				.withScope( reflection )
				.postReflectionCreation( errorDeclaration, getSymbol( errorNode ), undefined );
		}
	}
}

function createParameter(
	context: Context,
	reflection: DeclarationReflection,
	childTag: ParamExpressionNode,
	parent: DeclarationReflection
): ParameterReflection {
	const match = childTag.getText().match( ERROR_PARAM_REGEXP );
	const parameter = new ParameterReflection( childTag.name.text, ReflectionKind.Parameter, parent );
	let isArray = false;

	try {
		if ( !match ) {
			throw new Error( 'Invalid signature to process.' );
		}

		let typeName = match[ 1 ]!;
		const name = match[ 2 ]!;
		const description = match[ 3 ]!;

		if ( name!.includes( '.' ) ) {
			throw new Error( 'A dot notation @param is not supported.' );
		}

		parameter.name = name;
		isArray = typeName.startsWith( 'Array' );

		if ( isArray ) {
			// Extract the type name from `<` and `>` brackets.
			typeName = typeName.match( ARRAY_TYPE_REGEXP )!.at( 1 )!;
		}

		if ( typeName!.startsWith( 'module:' ) ) {
			const childReflection = getTarget( context, reflection, typeName! );

			if ( !childReflection ) {
				throw new Error( 'A module reflection cannot be found.' );
			}

			const returnType = ReferenceType.createResolvedReference(
				childTag.name.text,
				childReflection as DeclarationReflection,
				context.project
			);

			parameter.type = isArray ? new ArrayType( returnType ) : returnType;
		} else {
			// No need to wrap in `ArrayType` as we use the default typedoc mechanism here.
			parameter.type = context.converter.convertType( context, childTag.typeExpression );
		}

		parameter.comment = createComment( description );
	} catch {
		const anyType = new IntrinsicType( 'any' );

		parameter.type = isArray ? new ArrayType( anyType ) : anyType;
		parameter.comment = createComment( childTag.comment );
	}

	return parameter;
}

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

function getSymbol( node: ts.Node | ErrorTagNode ): ts.Symbol {
	const symbol = 'symbol' in node ? node.symbol : null;

	return symbol || getSymbol( node.parent );
}

type ParamExpressionNode = ts.Node & {
	name: {
		text: string;
	};
	tagName: {
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
	symbol?: ts.Symbol;
};

type MaybeCommentDisplayPart = null | string | Array<CommentDisplayPart>;
