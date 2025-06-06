/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * This function provides a consistent logging format for the changelog generation process.
 *
 * It logs the given text to the console, optionally indenting it by a specified number of levels.
 */
export function logInfo( text: string, { indent }: { indent: number } = { indent: 0 } ): void {
	console.log( ' '.repeat( indent * 3 ) + text );
}
