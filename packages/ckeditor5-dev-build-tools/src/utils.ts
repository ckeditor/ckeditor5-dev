/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'upath';
import type { CamelCase, CamelCasedProperties } from 'type-fest';

/**
 * Returns path relative to the current working directory.
 */
export function getPath( ...paths: Array<string> ): string {
	return path.join( process.cwd(), ...paths );
}

/**
 * Transforms `kebab-case` strings to `camelCase`.
 */
export function camelize<const T extends string>( s: T ): CamelCase<T> {
	return s.replace( /-./g, x => x[ 1 ]!.toUpperCase() ) as CamelCase<T>;
}

/**
 * Transforms all object keys from `kebab-case` to `camelCase`.
 */
export function camelizeObjectKeys<const T extends Record<string, any>>( obj: T ): CamelCasedProperties<T> {
	return Object.fromEntries(
		Object
			.entries( obj )
			.map( ( [ key, value ] ) => [ camelize( key ), value ] )
	) as CamelCasedProperties<T>;
}
