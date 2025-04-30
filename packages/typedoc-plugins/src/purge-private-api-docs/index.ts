/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReflectionKind,
	TypeScript,
	type Context,
	type Application,
	type DeclarationReflection
} from 'typedoc';
import fs from 'fs';
import upath from 'upath';
import { getPluginPriority } from '../utils/getpluginpriority.js';

/**
 * The `typedoc-plugin-purge-private-api-docs` removes reflections collected from private packages.
 * It also removes reflections sources from augmented interfaces which are collected from private packages.
 *
 * Private packages are marked with the `private: true` property in their `package.json` files.
 *
 * We do not want to expose private APIs in the documentation, but the paid features may extend the configuration reflection.
 * Add the `@publicApi` annotation to publish a private reflection within the block comment defining a module name.
 */
export function typeDocPurgePrivateApiDocs( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd, getPluginPriority( typeDocPurgePrivateApiDocs.name ) );
}

function onEventEnd( context: Context ) {
	const moduleReflections = context.project.getReflectionsByKind( ReflectionKind.Module ) as Array<DeclarationReflection>;

	const privateModuleReflections = moduleReflections.filter( reflection => {
		if ( !reflection.sources ) {
			return false;
		}

		const source = reflection.sources[ 0 ]!;
		const fullFileName = source.fullFileName;

		return isPrivatePackageFile( fullFileName );
	} );

	for ( const reflection of privateModuleReflections ) {
		const symbol = context.getSymbolFromReflection( reflection )!;
		const node = symbol.declarations!.at( 0 )! as TypeScript.SourceFile;

		if ( !isPublicApi( node ) ) {
			context.project.removeReflection( reflection );
		} else {
			removePrivateUrlSourcesFromReflection( reflection );
			removeNonPublicMembersFromReflection( reflection, context );
		}
	}

	const augmentedInterfaces = context.project.ckeditor5AugmentedInterfaces || [];

	for ( const reflection of augmentedInterfaces ) {
		removePrivateUrlSourcesFromReflection( reflection );
	}
}

function removeNonPublicMembersFromReflection( reflection: DeclarationReflection, context: Context ) {
	reflection.traverse( child => {
		const childReflection = child as DeclarationReflection;

		// Take care of all children before modifying the parent.
		removeNonPublicMembersFromReflection( childReflection, context );

		// Check if a child is non-public reflection.
		if ( isNonPublicReflection( childReflection ) ) {
			// Remove it when it is not inherited.
			if ( !childReflection.inheritedFrom ) {
				context.project.removeReflection( childReflection );
			}
			// Otherwise, check if it comes from a private package. If so, remove it.
			else if ( isInheritedReflectionFromPrivatePackage( childReflection ) ) {
				context.project.removeReflection( childReflection );
			}
		}

		// In case of a callable reflection, check if its signature exists.
		const isCallable =
			childReflection.kind === ReflectionKind.Method ||
			childReflection.kind === ReflectionKind.Accessor;

		if ( isCallable ) {
			const signatures = childReflection.kind === ReflectionKind.Method ?
				childReflection.signatures :
				[ childReflection.getSignature, childReflection.setSignature ].filter( Boolean );

			if ( !signatures || !signatures.length ) {
				context.project.removeReflection( childReflection );
			}
		}
	} );
}

function isNonPublicReflection( reflection: DeclarationReflection ) {
	return reflection.flags.isPrivate || reflection.flags.isProtected || hasInternalTag( reflection );
}

function hasInternalTag( reflection: DeclarationReflection ) {
	if ( !reflection ) {
		return false;
	}

	if ( !reflection.comment ) {
		return false;
	}

	if ( !reflection.comment.modifierTags ) {
		return false;
	}

	return reflection.comment.modifierTags.has( '@internal' );
}

function isInheritedReflectionFromPrivatePackage( reflection: DeclarationReflection ) {
	return isPrivatePackageFile( reflection.sources![ 0 ]!.fullFileName );
}

function removePrivateUrlSourcesFromReflection( reflection: DeclarationReflection ) {
	if ( reflection.sources ) {
		reflection.sources
			.filter( source => isPrivatePackageFile( source.fullFileName ) )
			.forEach( source => {
				delete source.url;
			} );
	}

	reflection.traverse( childReflection => {
		removePrivateUrlSourcesFromReflection( childReflection as DeclarationReflection );
	} );
}

function isPrivatePackageFile( fileName: string ) {
	let dirName = upath.dirname( fileName );

	// Find `package.json` by going up in the directory tree until reaching the root.
	while ( dirName !== upath.dirname( dirName ) ) {
		const pathToPackageJson = upath.join( dirName, 'package.json' );

		if ( fs.existsSync( pathToPackageJson ) ) {
			const packageJson = fs.readFileSync( pathToPackageJson ).toString();

			return !!JSON.parse( packageJson ).private;
		}

		dirName = upath.dirname( dirName );
	}

	throw new Error( `${ fileName } is not placed inside a npm package.` );
}

function isPublicApi( node: TypeScript.SourceFile ) {
	return node.statements.some( statement => {
		if ( !( 'jsDoc' in statement ) ) {
			return false;
		}

		if ( !Array.isArray( statement.jsDoc ) ) {
			return false;
		}

		return statement.jsDoc.some( ( jsDoc: TypeScript.JSDoc ) => {
			if ( !jsDoc.tags ) {
				return false;
			}

			return jsDoc.tags.some( tag => {
				if ( tag.tagName.kind !== TypeScript.SyntaxKind.Identifier ) {
					return false;
				}

				if ( tag.tagName.text !== 'publicApi' ) {
					return false;
				}

				return true;
			} );
		} );
	} );
}
