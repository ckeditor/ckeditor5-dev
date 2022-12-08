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
 *
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEventEnd() );
	}
};

function onEventEnd() {
	return context => {
		const moduleReflections = context.project.getReflectionsByKind( ReflectionKind.Module )
			.filter( reflection => {
				// TODO: Replace `process.cwd()` with options.
				const fileName = path.join( process.cwd(), reflection.originalName + '.ts' );

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

function removeSourcesFromReflection( reflection ) {
	delete reflection.sources;

	if ( !reflection.children ) {
		return;
	}

	for ( const child of reflection.children ) {
		removeSourcesFromReflection( child );
	}
}

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

function normalizePath( value ) {
	return value.replace( /\\/g, '/' );
}
