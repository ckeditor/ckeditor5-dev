/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, DeclarationReflection, Comment, CommentTag } = require( 'typedoc' );
const ts = require( 'typescript' );

const ERROR_TAG_NAME = 'error';

/**
 * The `typedoc-plugin-module-fixer` reads the module name specified in the `@module` tag name.
 *
 *      @module package/file
 *
 * For the example specified above, a name of the parsed module should be equal to "package/file".
 *
 * It may happen that imports statement are specified above the "@module" block code.
 * In such a case, built-in plugin in `typedoc` does not read its value properly.
 */
module.exports = {
	load( app ) {
		const processedModules = new Set();

		app.converter.on( Converter.EVENT_CREATE_DECLARATION, onEventCreateDeclaration( processedModules ) );
	}
};

function onEventCreateDeclaration( processedModules ) {
	return ( context, reflection ) => {
		try {
			if ( reflection.kind !== ReflectionKind.Module ) {
				return;
			}

			const symbol = context.project.getSymbolFromReflection( reflection );
			const node = symbol.declarations[ 0 ];
			const sourceFile = node.getSourceFile();

			// Process the same file only once.
			if ( processedModules.has( sourceFile.resolvedPath ) ) {
				return;
			}

			processedModules.add( sourceFile.resolvedPath );

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

			for ( const errorNode of nodes ) {
				const parentNode = errorNode.parent;
				const errorName = parentNode.comment;

				try {
					const errorDeclaration = new DeclarationReflection( errorName, ReflectionKind.ObjectLiteral, reflection );
					context.addChild( errorDeclaration );

					let commentSummary;
					const commentSummaryNodes = [];

					if ( typeof parentNode.parent.comment === 'string' ) {
						commentSummaryNodes.push( parentNode.parent );
						commentSummary = [
							{
								kind: 'text',
								text: parentNode.parent.comment
							}
						];
					} else {
						commentSummaryNodes.push( ...parentNode.parent.comment );
						commentSummary = parentNode.parent.comment.map( item => {
							let { text } = item;

							if ( item.kind === 324 ) {
								if ( item.name ) {
									text = item.name.escapedText + text;
								}

								return {
									kind: 'inline-tag',
									tag: '@link',
									text
								};
							}

							return {
								kind: 'text',
								text
							};
						} );
					}

					const comment = new Comment( commentSummary );

					errorDeclaration.originalName = 'EventDeclaration';
					errorDeclaration.kindString = 'Object literal';
					errorDeclaration.comment = comment;

					for ( const childTag of parentNode.parent.getChildren() ) {
						// Do not process the `@error` tag again.
						if ( childTag === parentNode ) {
							continue;
						}

						// Do not process the error description.
						if ( commentSummaryNodes.includes( childTag ) ) {
							continue;
						}

						if ( !childTag.comment ) {
							continue;
						}

						const errorParamTag = [];
						let commentTag;

						if ( typeof childTag.comment === 'string' ) {
							commentTag = new CommentTag(
								`@${ childTag.tagName.escapedText }`,
								[
									{
										kind: 'text',
										text: childTag.comment
									}
								]
							);
						} else {
							commentTag = new CommentTag(
								`@${ childTag.tagName.escapedText }`,
								childTag.comment.map( item => {
									let { text } = item;

									if ( item.kind === 324 ) {
										if ( item.name ) {
											text = item.name.escapedText + text;
										}

										return {
											kind: 'inline-tag',
											tag: '@link',
											text
										};
									}

									return {
										kind: 'text',
										text
									};
								} )
							);
						}
					}
				} catch ( err ) {
					console.log( err );
				}
			}

			// if ( processedModules.size === 1 ) {
			// 	console.log( require( 'util' ).inspect( context, { showHidden: false, depth: 1, colors: true } ) );
			// }
		} catch ( err ) {
			console.log( err );
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
