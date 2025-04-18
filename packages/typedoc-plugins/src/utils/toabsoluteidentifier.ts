/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type Reflection, ReflectionKind } from 'typedoc';

/**
 * Converts a relative identifier into an absolute one.
 */
export function toAbsoluteIdentifier( reflection: Reflection, identifier: string ): string {
	const separator = identifier[ 0 ];
	const parts = getLongNameParts( reflection );

	return separator === '~' ?
		'module:' + parts[ 0 ] + identifier :
		'module:' + parts[ 0 ] + '~' + parts[ 1 ] + identifier;
}

/**
 * Returns a longname for a reflection, divided into separate parts.
 */
function getLongNameParts( reflection: Reflection ) {
	// Kinds of reflection that affect the longname format.
	const kinds = [
		ReflectionKind.Module,
		ReflectionKind.Class,
		ReflectionKind.Function,
		ReflectionKind.Interface,
		ReflectionKind.TypeAlias,
		ReflectionKind.Accessor,
		ReflectionKind.Variable,
		ReflectionKind.Method,
		ReflectionKind.Property
	];

	const parts = [];

	while ( reflection ) {
		if ( kinds.includes( reflection.kind ) ) {
			parts.unshift( reflection.name );
		}

		reflection = reflection.parent!;
	}

	return parts;
}
