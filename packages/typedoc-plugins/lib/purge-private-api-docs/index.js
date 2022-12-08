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
		const modules = new Set();
		app.converter.on( Converter.EVENT_CREATE_DECLARATION, onEventCreateDeclaration( modules ) );
		app.converter.on( Converter.EVENT_END, onEnd( modules ) );
	}
};

function onEnd( modules ) {
	return context => {
		for ( const modulePath of modules ) {
			const module = context.project.getChildByName( [ modulePath ] );

			removeSourcesFromReflection( module );
		}
	};

	function removeSourcesFromReflection( reflection ) {
		delete reflection.sources;

		if ( !reflection.children ) {
			return;
		}

		for ( const child of reflection.children ) {
			removeSourcesFromReflection( child );
		}
	}
}

function onEventCreateDeclaration( modules ) {
	return ( context, reflection ) => {
		// So far, we purge the entire module when processing a private package.
		if ( reflection.kind !== ReflectionKind.Module ) {
			return;
		}

		// TODO: Replace `process.cwd()` with options.
		const fileName = path.join( process.cwd(), reflection.originalName + '.ts' );

		// When processing a non-private package, just leave the plugin.
		if ( !isPrivatePackageFile( fileName ) ) {
			return;
		}

		const symbol = context.project.getSymbolFromReflection( reflection );

		// When processing an empty file.
		if ( !symbol ) {
			return;
		}

		const node = symbol.declarations[ 0 ];

		let publicApi;

		// Iterate over statements...
		for ( const statement of node.statements ) {
			// TODO: No idea how to cover this line.
			// CKEditor 5 enters the if. However, the same code created as a fixture doesn't.
			if ( !Array.isArray( statement.jsDoc ) ) {
				continue;
			}

			// ...to find a JSDoc block code...
			for ( const jsDoc of statement.jsDoc ) {
				// ...that represents a module definition.
				[ publicApi ] = ( jsDoc.tags || [] ).filter( tag => {
					return tag.tagName.kind === ts.SyntaxKind.Identifier && tag.tagName.text === 'publicApi';
				} );

				if ( publicApi ) {
					break;
				}
			}

			if ( publicApi ) {
				break;
			}
		}

		if ( !publicApi ) {
			context.project.removeReflection( reflection );
		} else {
			modules.add( reflection.name );
		}
	};
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
