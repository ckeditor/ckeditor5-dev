/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
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
 *
 * The plugin requires the `cwd` option provided when bootstrapping a new application (`TypeDoc.Application().bootstrap()`).
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEventEnd( app ) );
	}
};

/**
 * @returns {Function}
 */
function onEventEnd( app ) {
	return context => {
		const cwd = app.options.getValue( 'cwd' );

		const moduleReflections = context.project.getReflectionsByKind( ReflectionKind.Module )
			.filter( reflection => {
				const fileName = path.join( cwd, reflection.originalName + '.ts' );

				return isPrivatePackageFile( fileName );
			} );

		for ( const reflection of moduleReflections ) {
			const symbol = context.project.getSymbolFromReflection( reflection );

			// When processing an empty file.
			if ( !symbol ) {
				return;
			}

			const node = symbol.declarations[ 0 ];

			const publicApi = node.statements.some( statement => {
				if ( !Array.isArray( statement.jsDoc ) ) {
					return false;
				}

				return statement.jsDoc.some( jsDoc => {
					return ( jsDoc.tags || [] )
						.filter( tag => {
							return tag.tagName.kind === ts.SyntaxKind.Identifier && tag.tagName.text === 'publicApi';
						} )
						.shift();
				} );
			} );

			if ( !publicApi ) {
				context.project.removeReflection( reflection );
			} else {
				removeSourcesFromReflection( reflection );
			}
		}
	};
}

/**
 * @param {Object} reflection
 * @param {Array} reflection.sources
 * @param {Array} [reflection.children]
 */
function removeSourcesFromReflection( reflection ) {
	delete reflection.sources;

	if ( !reflection.children ) {
		return;
	}

	for ( const child of reflection.children ) {
		removeSourcesFromReflection( child );
	}
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
		if ( dirName === path.posix.dirname( dirName ) ) {
			throw new Error( `${ fileName } is not placed inside a npm package.` );
		}
	}
}

/**
 * @param {String} value
 * @returns {String}
 */
function normalizePath( value ) {
	return value.replace( /\\/g, '/' );
}
