/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Compares strings by code units, independently of the locale, so sorted state files are the same on every machine.
 */
export function compare( a: string, b: string ): number {
	if ( a === b ) {
		return 0;
	}

	return a < b ? -1 : 1;
}

/**
 * Joins the lines of a text into one line, for example to show a multi-line error in a list.
 */
export function inline( text: string ): string {
	return text.replace( /\s*\n\s*/g, ' ' ).trim();
}

export function plural( count: number, word: string ): string {
	return count === 1 ? word : `${ word }s`;
}
