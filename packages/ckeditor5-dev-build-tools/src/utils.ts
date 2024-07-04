/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createRequire } from 'module';
import path from 'upath';
import type { CamelCase, CamelCasedProperties } from 'type-fest';

const require = createRequire( import.meta.url );

/**
 * Returns path relative to the current working directory.
 */
export function getCwdPath( ...paths: Array<string> ): string {
	return path.resolve( process.cwd(), ...paths );
}

/**
 * Transforms `kebab-case` strings to `camelCase`.
 */
export function camelize<T extends string>( s: T ): CamelCase<T> {
	return s.replace( /-./g, x => x[ 1 ]!.toUpperCase() ) as CamelCase<T>;
}

/**
 * Transforms first-level object keys from `kebab-case` to `camelCase`.
 */
export function camelizeObjectKeys<T extends Record<string, any>>( obj: T ): CamelCasedProperties<T> {
	return Object.fromEntries(
		Object
			.entries( obj )
			.map( ( [ key, value ] ) => [ camelize( key ), value ] )
	) as CamelCasedProperties<T>;
}

/**
 * Returns string without whitespace.
 */
export function removeWhitespace( text: string ): string {
	return text.replaceAll( /\n\s+/gm, '\n' );
}

/**
 * Returns string without newlines.
 */

export function removeNewlines( text: string ): string {
	return text.replaceAll( /\r?\n|\r/g, '' );
}

/**
 * Returns dependency resolved relative to the current working directory. This is needed to ensure
 * that the dependency of this package itself (which may be in a different version) is not used.
 */
export function getUserDependency( name: string ): any {
	const path = require.resolve( name, {
		paths: [ process.cwd() ]
	} );

	return require( path );
}
