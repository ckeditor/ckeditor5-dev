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

/**
 * Returns the message of a thrown value. Hooks of a task may throw anything, for example a string.
 */
export function getErrorMessage( error: unknown ): string {
	return error instanceof Error ? error.message : String( error );
}

export function plural( count: number, word: string ): string {
	return count === 1 ? word : `${ word }s`;
}
