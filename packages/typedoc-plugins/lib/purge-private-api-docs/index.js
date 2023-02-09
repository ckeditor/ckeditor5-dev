/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind } = require( 'typedoc' );
const ts = require( 'typescript' );
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
			.filter( reflection => isPrivatePackageFile( reflection.sources[ 0 ].fullFileName ) );

		for ( const reflection of moduleReflections ) {
			const symbol = context.project.getSymbolFromReflection( reflection );

			// When processing an empty file.
			if ( !symbol ) {
				return;
			}

			const node = symbol.declarations[ 0 ];

			if ( !isPublicApi( node ) ) {
				context.project.removeReflection( reflection );

				continue;
			}

			removeUrlSourcesFromReflection( reflection );

			const moduleFileName = reflection.sources[ 0 ].fileName;

			const localReflections = Object.values( context.project.reflections ).filter( refl => {
				if ( !refl.sources ) {
					return false;
				}

				if ( refl.sources[ 0 ].fileName !== moduleFileName ) {
					return false;
				}

				return true;
			} );

			const inheritedReflections = Object.values( context.project.reflections ).filter( refl => {
				if ( !refl.inheritedFrom ) {
					return false;
				}

				if ( !refl.parent || !refl.parent.sources ) {
					return false;
				}

				if ( refl.parent.sources[ 0 ].fileName !== moduleFileName ) {
					return false;
				}

				return true;
			} );

			const inheritedReflectionsFromPrivatePackages = inheritedReflections.filter( refl => {
				return isPrivatePackageFile( refl.sources[ 0 ].fullFileName );
			} );

			const reflectionsToRemove = [ ...localReflections, ...inheritedReflectionsFromPrivatePackages ].filter( refl => {
				if ( refl.flags.includes( 'Private' ) ) {
					return true;
				}

				if ( refl.flags.includes( 'Protected' ) ) {
					return true;
				}

				return false;
			} );

			reflectionsToRemove.forEach( reflection => context.project.removeReflection( reflection ) );
		}
	};
}

/**
 * @param {Object} reflection
 * @param {Array} reflection.sources
 * @param {Function} reflection.traverse
 * @param {Array} [reflection.children]
 */
function removeUrlSourcesFromReflection( reflection ) {
	if ( reflection.sources ) {
		reflection.sources.forEach( source => delete source.url );
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
				if ( tag.tagName.kind !== ts.SyntaxKind.Identifier ) {
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
