/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format } from 'date-fns';

/**
 * @returns {String}
 */
export default function getFormattedDate() {
	return format( new Date(), 'yyyy-MM-dd' );
}
