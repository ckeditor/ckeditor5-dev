/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format, parse } from 'date-fns';

export function getDateFormatted( date: string ): string {
	return format( parse( date, 'yyyy-MM-dd', new Date() ), 'LLLL d, yyyy' );
}
