/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * This function provides consistent logging format for changelog generation process.
 */
export function logInfo( text: string, { indent }: { indent: number } = { indent: 0 } ): void {
	console.log( ' '.repeat( indent * 3 ) + text );
}
