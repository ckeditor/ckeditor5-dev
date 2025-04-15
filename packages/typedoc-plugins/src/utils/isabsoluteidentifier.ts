/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Checks if the identifier is an absolute one.
 */
export function isAbsoluteIdentifier( identifier: string ): boolean {
	return identifier.startsWith( 'module:' );
}
