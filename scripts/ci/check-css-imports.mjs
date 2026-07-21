#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { styleText } from 'node:util';
import upath from 'upath';
import { glob } from 'glob';

/**
 * Validates that every relative `@import` in the stylesheets of the `packages/*` directories
 * points at an existing file. The dependency checker (`knip`) verifies packages imported in
 * CSS, but it silently skips unresolvable relative specifiers coming from compiled sources.
 */
const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..', '..' );

const cssPaths = await glob( 'packages/*/theme/**/*.css', { cwd: ROOT_DIRECTORY, absolute: true } );

const errors = cssPaths.flatMap( cssPath => {
	const content = fs.readFileSync( cssPath, 'utf-8' );

	return [ ...content.matchAll( /@import\s+(?:url\(\s*)?["']([^"']+)["']/g ) ]
		.map( ( [ , specifier ] ) => specifier )
		.filter( specifier => specifier.startsWith( './' ) || specifier.startsWith( '../' ) )
		.filter( specifier => !fs.existsSync( upath.join( upath.dirname( cssPath ), specifier ) ) )
		.map( specifier => `"${ upath.relative( ROOT_DIRECTORY, cssPath ) }" imports "${ specifier }", which does not exist.` );
} );

if ( errors.length ) {
	console.error( styleText( 'red', '❌  Broken CSS imports found:' ) );
	console.error( styleText( 'red', errors.join( '\n' ) ) );
	process.exit( 1 );
} else {
	console.log( styleText( 'green', '✅  All relative CSS imports point at existing files.' ) );
}
