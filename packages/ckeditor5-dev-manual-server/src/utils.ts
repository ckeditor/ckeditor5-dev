/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { relative, isAbsolute } from 'node:path';

export interface CachedValue<T> {
	get(): T;
	invalidate(): void;
}

/**
 * Caches the computed value until the cache is invalidated.
 */
export function cacheValue<T>( compute: () => T ): CachedValue<T> {
	let cached: { value: T } | null = null;

	return {
		get() {
			cached ||= { value: compute() };

			return cached.value;
		},

		invalidate() {
			cached = null;
		}
	};
}

/**
 * Stringifies the values of the given object.
 */
export function stringifyValues( obj: Record<string, unknown> ): Record<string, string> {
	return Object.fromEntries(
		Object
			.entries( obj )
			.map( ( [ key, value ] ) => [ key, JSON.stringify( value ) ] )
	);
}

export function normalizePackageName( packageName: string ): string {
	return packageName.replace( /^ckeditor5-/, '' );
}

/**
 * Builds a predicate that decides whether a package is part of the `include` selection. When the
 * selection is empty every package is included. Package names are matched by their normalized form,
 * so both short (`case-change`) and full (`ckeditor5-case-change`) names work. A `null` package name
 * (an asset without a package segment) is only kept when the selection is empty.
 */
export function createPackageNameFilter(
	includePackageNames: Array<string>
): ( packageName: string | null ) => boolean {
	if ( includePackageNames.length == 0 ) {
		return () => true;
	}

	const normalizedIncludePackageNames = new Set( includePackageNames.map( normalizePackageName ) );

	return packageName => packageName != null && normalizedIncludePackageNames.has( normalizePackageName( packageName ) );
}

export function toPublicFilePath( filePath: string, workspaceRoot: string ): string {
	const relativeFilePath = relative( workspaceRoot, filePath );

	if ( !relativeFilePath.startsWith( '..' ) && !isAbsolute( relativeFilePath ) ) {
		return toPublicSpecifier( relativeFilePath );
	}

	return `/@fs/${ toPosixPath( filePath ) }`;
}

export function toPublicSpecifier( relativeFilePath: string ): string {
	return `/${ stripLeadingSlash( toPosixPath( relativeFilePath ) ) }`;
}

export function toPosixPath( value: string ): string {
	return value.replace( /\\/g, '/' );
}

export function stripLeadingSlash( value: string ): string {
	return value.startsWith( '/' ) ? value.slice( 1 ) : value;
}
