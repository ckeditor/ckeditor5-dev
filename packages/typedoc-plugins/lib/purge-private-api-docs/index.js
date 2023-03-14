/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeScript } = require( 'typedoc' );
const path = require( 'path' );
const fs = require( 'fs' );

/**
 * The `typedoc-plugin-purge-private-api-docs` removes reflections collected from private packages.
 *
 * Private packages are marked with the `private: true` property in their `package.json` files.
 *
 * We do not want to expose private APIs in the documentation, but the paid features may extend the configuration reflection.
 * Add the `@publicApi` annotation to publish a private reflection within the block comment defining a module name.
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEventEnd() );
	}
};

/**
 * @returns {Function}
 */
function onEventEnd() {
	return context => {
		const moduleReflections = context.project.getReflectionsByKind( ReflectionKind.Module )
			.filter( reflection => {
				// Not a module.
				if ( !reflection.sources ) {
					return false;
				}

				const [ { fullFileName } ] = reflection.sources;
				return isPrivatePackageFile( fullFileName );
			} );

		for ( const reflection of moduleReflections ) {
			const symbol = context.project.getSymbolFromReflection( reflection );

			const node = symbol.declarations[ 0 ];

			if ( !isPublicApi( node ) ) {
				context.project.removeReflection( reflection );
			} else {
				removeUrlSourcesFromReflection( reflection );
				removeNonPublicMembersFromReflection( reflection, context );
			}
		}
	};
}

function removeNonPublicMembersFromReflection( reflection, context ) {
	reflection.traverse( child => {
		// Take care of all children before modifying the parent.
		removeNonPublicMembersFromReflection( child, context );

		// Check if a child is non-public reflection.
		if ( isNonPublicReflection( child ) ) {
			// Remove it when it is not inherited.
			if ( !child.inheritedFrom ) {
				context.project.removeReflection( child );
			}
			// Otherwise, check if it comes from a private package. If so, remove it.
			else if ( isInheritedReflectionFromPrivatePackage( child ) ) {
				context.project.removeReflection( child );
			}
		}

		let signatures = null;

		if ( child.kind === ReflectionKind.Method ) {
			signatures = child.signatures;
		} else if ( child.kind === ReflectionKind.Accessor ) {
			signatures = [ child.getSignature, child.setSignature ].filter( Boolean );
		}

		if ( signatures && !signatures.length ) {
			context.project.removeReflection( child );
		}
	} );
}

/**
 * @param {Object} reflection
 * @returns {Boolean}
 */
function isNonPublicReflection( reflection ) {
	return reflection.flags.isPrivate || reflection.flags.isProtected || hasInternalTag( reflection );
}

/**
 * @param {Object} reflection
 * @returns {Boolean}
 */
function hasInternalTag( reflection ) {
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

/**
 * @param {Object} reflection
 * @returns {Boolean}
 */
function isInheritedReflectionFromPrivatePackage( reflection ) {
	return isPrivatePackageFile( reflection.sources[ 0 ].fullFileName );
}

/**
 * @param {Object} reflection
 * @param {Array} reflection.sources
 * @param {Function} reflection.traverse
 * @param {Array} [reflection.children]
 */
function removeUrlSourcesFromReflection( reflection ) {
	if ( reflection.sources ) {
		reflection.sources.forEach( source => {
			delete source.url;
		} );
	}

	reflection.traverse( childReflection => {
		removeUrlSourcesFromReflection( childReflection );
	} );
}

/**
 * @param {String} fileName
 * @returns {Boolean}
 */
function isPrivatePackageFile( fileName ) {
	// Normalize the input path.
	let dirName = path.posix.dirname( normalizePath( fileName ) );

	while ( true ) {
		const pathToPackageJson = path.posix.join( dirName, 'package.json' );

		if ( fs.existsSync( pathToPackageJson ) ) {
			return !!JSON.parse( fs.readFileSync( pathToPackageJson ).toString() ).private;
		}

		dirName = path.posix.dirname( dirName );

		// Root's dirname is equal to the root,
		// So if this check passes, then we should break this endless loop.
		/* istanbul ignore if : an edge case to process a file outside a project */
		if ( dirName === path.posix.dirname( dirName ) ) {
			throw new Error( `${ fileName } is not placed inside a npm package.` );
		}
	}
}

/**
 * @param {Object} node
 * @returns {Boolean}
 */
function isPublicApi( node ) {
	return node.statements.some( statement => {
		if ( !Array.isArray( statement.jsDoc ) ) {
			return false;
		}

		return statement.jsDoc.some( jsDoc => {
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

/**
 * @param {String} value
 * @returns {String}
 */
function normalizePath( value ) {
	return value.replace( /\\/g, '/' );
}
