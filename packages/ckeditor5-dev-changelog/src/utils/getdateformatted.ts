/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format, parse } from 'date-fns';

/**
 * Formats a date string `YYYY-MM-DD` into a human-readable format for the changelog.
 */
export function getDateFormatted( date: string ): string {
	return format( parse( date, 'yyyy-MM-dd', new Date() ), 'LLLL d, yyyy' );
}
